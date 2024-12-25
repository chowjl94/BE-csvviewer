import { Request, Response } from "express";
import {
	fetchCsvFromS3,
	generatePresignedUrl,
	uploadFileToS3Service,
} from "../services/fileService";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload file route handler
export const uploadFile = (req: Request, res: Response) => {
	const uploadMiddleware = upload.single("csvFile");
	uploadMiddleware(req, res, async (err) => {
		if (err) {
			return res
				.status(500)
				.json({ message: "File upload failed", error: err });
		}

		try {
			const result = await uploadFileToS3Service(req.file!);
			res
				.status(200)
				.json({ message: "File uploaded successfully", data: result });
		} catch (error) {
			res
				.status(500)
				.json({ message: "Failed to upload file to S3", error: error });
		}
	});
};

export const getFiles = async (req: Request, res: Response) => {
	const objectKey = req.params.objectKey;
	try {
		const url = await generatePresignedUrl(objectKey);
		res.json({ url });
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		res.status(500).send("Error generating URL");
	}
};

export const getCsv = async (req: Request, res: Response) => {
	const presignedUrl = req.params.signedUrl as string;
	try {
		const csvData = await fetchCsvFromS3(presignedUrl);
		res.set("Content-Type", "text/csv");
		res.send(csvData);
	} catch (error) {
		console.error("Error fetching CSV:", error);
		res.status(500).send("Error fetching CSV");
	}
};
