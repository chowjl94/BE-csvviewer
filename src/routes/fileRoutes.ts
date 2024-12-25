import express from "express";
import { uploadFile, getFiles, getCsv } from "../controllers/fileController";

const router = express.Router();

router.post("/upload", uploadFile);

router.get("/:objectKey", getFiles);

router.get("/csv/:signedUrl", getCsv);

export default router;
