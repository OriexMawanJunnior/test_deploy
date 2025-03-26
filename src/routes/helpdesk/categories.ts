import express from "express";
import { getCategories } from "../../services/helpdesk.service";

const router = express.Router();

router.get("/", getCategories);

export default router;