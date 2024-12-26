import * as multer from "multer";
import { Request, Response } from "express";
// import { uploadFile, getFiles, getCsv } from "../controllers/fileController";
import { uploadFile, getFiles, getCsv } from "../../controllers/fileController";
import {
	uploadFileToS3Service,
	generatePresignedUrl,
	fetchCsvFromS3,
} from "../../services/fileService";

import { mocked } from "jest-mock";

// Mock the services
jest.mock("../../services/fileService");

// Mock multer
jest.mock("multer", () => {
	return {
		memoryStorage: jest.fn().mockReturnValue({}),
		single: jest.fn().mockImplementation((fieldName: string) => {
			return (req: Request, res: Response, next: Function) => {
				// Simulate a file being uploaded
				req.file = {
					fieldname: fieldName,
					originalname: "test-file.csv",
					encoding: "7bit",
					mimetype: "text/csv",
					size: 1024,
					buffer: Buffer.from("file data"),
				} as Express.Multer.File;
				next();
			};
		}),
	};
});

// Mock response helper
const mockResponse = () => {
	const res: any = {
		status: jest.fn().mockReturnThis(),
		json: jest.fn(),
		send: jest.fn(),
		set: jest.fn(),
	};
	return res;
};

describe("File Controller Tests", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("uploadFile", () => {
		it("should upload file successfully and return success response", async () => {
			const mockResult = {
				fileUrl: "https://s3.example.com/test-file.csv",
				$metadata: {
					httpStatusCode: 200,
					requestId: "mockRequestId",
					extendedRequestId: "mockExtendedRequestId",
					cfId: "mockCfId",
				},
			};

			mocked(uploadFileToS3Service).mockResolvedValue(mockResult);

			const req = {
				file: {
					buffer: Buffer.from("file data"),
					originalname: "test-file.csv",
				},
			} as unknown as Request;

			const res = mockResponse();

			await uploadFile(req, res);

			expect(uploadFileToS3Service).toHaveBeenCalledWith(req.file);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: "File uploaded successfully",
				data: mockResult,
			});
		});

		it("should handle file upload errors", async () => {
			mocked(uploadFileToS3Service).mockRejectedValue(
				new Error("File upload failed")
			);

			const req = {
				file: {
					buffer: Buffer.from("file data"),
					originalname: "test-file.csv",
				},
			} as unknown as Request;
			const res = mockResponse();

			await uploadFile(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.json).toHaveBeenCalledWith({
				message: "Failed to upload file to S3",
				error: new Error("File upload failed"),
			});
		});
	});

	describe("getFiles", () => {
		it("should generate and return a presigned URL", async () => {
			const mockUrl = "https://s3.example.com/test-file.csv";
			mocked(generatePresignedUrl).mockResolvedValue(mockUrl);

			const req = {
				params: { objectKey: "test-file.csv" },
			} as unknown as Request;
			const res = mockResponse();

			await getFiles(req, res);

			expect(generatePresignedUrl).toHaveBeenCalledWith("test-file.csv");
			expect(res.json).toHaveBeenCalledWith({ url: mockUrl });
		});

		it("should handle error while generating presigned URL", async () => {
			mocked(generatePresignedUrl).mockRejectedValue(
				new Error("Error generating URL")
			);

			const req = {
				params: { objectKey: "test-file.csv" },
			} as unknown as Request;
			const res = mockResponse();

			await getFiles(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith("Error generating URL");
		});
	});

	describe("getCsv", () => {
		it("should fetch and return CSV data", async () => {
			const mockCsvData = "id,name\n1,John\n2,Doe";
			mocked(fetchCsvFromS3).mockResolvedValue(mockCsvData);

			const req = {
				params: { signedUrl: "https://s3.example.com/test-file.csv" },
			} as unknown as Request;
			const res = mockResponse();

			await getCsv(req, res);

			expect(fetchCsvFromS3).toHaveBeenCalledWith(
				"https://s3.example.com/test-file.csv"
			);
			expect(res.set).toHaveBeenCalledWith("Content-Type", "text/csv");
			expect(res.send).toHaveBeenCalledWith(mockCsvData);
		});

		it("should handle error while fetching CSV", async () => {
			mocked(fetchCsvFromS3).mockRejectedValue(new Error("Error fetching CSV"));

			const req = {
				params: { signedUrl: "https://s3.example.com/test-file.csv" },
			} as unknown as Request;
			const res = mockResponse();

			await getCsv(req, res);

			expect(res.status).toHaveBeenCalledWith(500);
			expect(res.send).toHaveBeenCalledWith("Error fetching CSV");
		});
	});
});
