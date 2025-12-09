import { Router } from "express";
import { handleChat } from "../controllers/assistantController.js";

const router = Router();

router.post("/chat", handleChat);

export default router;
