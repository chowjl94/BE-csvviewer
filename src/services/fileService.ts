import {
	S3Client,
	PutObjectCommand,
	ListObjectsV2Command,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const s3 = new S3Client({ region: process.env.S3_REGION });
const BUCKET_NAME = process.env.AWS_BUCKET;

export const uploadFileToS3Service = async (file: Express.Multer.File) => {
	if (!file) {
		console.error("No file provided");
		throw new Error("No file provided");
	}
	const fileName = `${uuidv4()}-${file.originalname}`;

	const params = {
		Bucket: BUCKET_NAME as string,
		Key: fileName,
		Body: file.buffer,
		ContentType: file.mimetype,
	};

	try {
		const command = new PutObjectCommand(params);
		const response = await s3.send(command);

		return {
			...response,
			fileUrl: `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileName}`,
		};
	} catch (err) {
		console.log(`Error uploading file ${err}`);
		throw new Error(`Error uploading file: ${err}`);
	}
};

export const listFilesFromS3 = async (page: number, limit: number) => {
	const maxKeys = limit;
	const startAfter = (page - 1) * maxKeys;

	const listParams = {
		Bucket: BUCKET_NAME,
		MaxKeys: maxKeys,
		StartAfter: startAfter.toString(),
	};

	try {
		const command = new ListObjectsV2Command(listParams);
		const response = await s3.send(command);

		const files =
			response.Contents?.map((file) => ({
				fileName: file.Key,
				fileUrl: `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${file.Key}`,
			})) || [];

		return {
			data: files,
			page,
			totalFiles: response.KeyCount || 0,
			nextToken: response.NextContinuationToken,
		};
	} catch (err) {
		console.log(`Error retrieving files ${err}`);
		throw new Error(`Error retrieving files: ${err}`);
	}
};

export const generatePresignedUrl = async (objectKey: string) => {
	const command = new GetObjectCommand({
		Bucket: BUCKET_NAME,
		Key: objectKey,
	});

	try {
		const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
		return url;
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		throw new Error("Error generating presigned URL");
	}
};

export const fetchCsvFromS3 = async (presignedUrl: string) => {
	try {
		const response = await fetch(presignedUrl);
		if (!response.ok) {
			throw new Error("Error fetching CSV from S3");
		}
		const csvData = await response.text();
		return csvData;
	} catch (error) {
		console.error("Error fetching CSV from S3:", error);
		throw new Error("Error fetching CSV from S3");
	}
};
