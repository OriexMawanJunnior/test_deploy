import express from "express";
import { handleChat, getAvailableApiKeys, selectApiKey } from "../../services/chat.service";

const router = express.Router();

router.post("/", handleChat);
router.get("/api-keys", getAvailableApiKeys);
router.post("/select-api-key", selectApiKey);

export default router;