import express from "express";
import { webhook } from "../controllers/webhookControllers.js";

const router = express.Router();

router.post("/stripe", webhook);

export default router;
