import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
	uploadFileToS3Service,
	generatePresignedUrl,
	fetchCsvFromS3,
} from "../../services/fileService";

// Mock the imports
jest.mock("@aws-sdk/client-s3");
jest.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: jest.fn(), // Mock getSignedUrl
}));

global.fetch = jest.fn();

describe("file Services", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		S3Client.prototype.send = jest.fn(); // Mock the send method on the prototype
	});

	// Test for uploadFileToS3Service
	describe("uploadFileToS3Service", () => {
		it("should upload a file to S3", async () => {
			const file = {
				originalname: "test.csv",
				buffer: Buffer.from("test content"),
				mimetype: "text/plain",
			} as Express.Multer.File;

			const mockResponse = { ETag: "mock-etag" };

			const mockPutObjectCommand = jest.fn().mockImplementation(() => ({
				...mockResponse,
			}));

			const sendMock = jest.fn().mockResolvedValue(mockResponse);
			S3Client.prototype.send = sendMock;

			(PutObjectCommand as unknown as jest.Mock) = mockPutObjectCommand;

			const result = await uploadFileToS3Service(file);

			expect(sendMock).toHaveBeenCalledTimes(1);

			expect(PutObjectCommand).toHaveBeenCalledWith({
				Bucket: process.env.AWS_BUCKET,
				Key: expect.stringContaining("test.csv"),
				Body: file.buffer,
				ContentType: file.mimetype,
			});

			expect(result).toHaveProperty("fileUrl");
			expect(result).toHaveProperty("ETag", "mock-etag");
		});
	});

	describe("generatePresignedUrl", () => {
		it("should generate presigned URL for an s3 object", async () => {
			const mockGetSignedUrl = getSignedUrl as jest.Mock;
			mockGetSignedUrl.mockResolvedValue("https://example.com/presigned-url");

			const mockObjectKey = "test-file.csv";
			const result = await generatePresignedUrl(mockObjectKey);

			expect(mockGetSignedUrl).toHaveBeenCalledTimes(1);
			expect(mockGetSignedUrl).toHaveBeenCalledWith(
				expect.any(S3Client),
				expect.objectContaining({
					Bucket: process.env.AWS_BUCKET,
					Key: mockObjectKey,
				}),
				{ expiresIn: 60 * 5 }
			);

			expect(result).toBe("https://example.com/presigned-url");
		});
	});

	describe("fetchCSVfromS3", () => {
		it("should fetch CSV data successfully from S3", async () => {
			const mockCsvData = "column1,column2\nvalue1,value2";
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				text: jest.fn().mockResolvedValueOnce(mockCsvData),
			});

			const presignedUrl = "https://example.com/presigned-url";
			const result = await fetchCsvFromS3(presignedUrl);

			expect(fetch).toHaveBeenCalledWith(presignedUrl);
			expect(result).toBe(mockCsvData);
		});
		it("should throw an error if fetch fails", async () => {
			(fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				statusText: "Not Found",
			});

			const presignedUrl = "https://example.com/presigned-url";
			await expect(fetchCsvFromS3(presignedUrl)).rejects.toThrow(
				"Error fetching CSV from S3"
			);

			expect(fetch).toHaveBeenCalledWith(presignedUrl);
		});

		it("should handle errors thrown by fetch", async () => {
			(fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
			const presignedUrl = "https://example.com/presigned-url";

			await expect(fetchCsvFromS3(presignedUrl)).rejects.toThrow(
				"Error fetching CSV from S3"
			);

			expect(fetch).toHaveBeenCalledWith(presignedUrl);
		});
	});
});
