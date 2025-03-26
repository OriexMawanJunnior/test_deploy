import express from "express";
import { getLatestDocument, getDocumentVersions, addNewDocument } from "../../services/document.service";

const router = express.Router();

router.get("/:categoryId", getLatestDocument);
router.get("/:categoryId/version", getDocumentVersions);
router.post("/:categoryId", addNewDocument);

export default router;