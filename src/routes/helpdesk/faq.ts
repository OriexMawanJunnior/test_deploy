import express from "express";
import { getFAQs } from "../../services/faq.service";

const router = express.Router();

router.get("/:categoryId", getFAQs);

export default router;