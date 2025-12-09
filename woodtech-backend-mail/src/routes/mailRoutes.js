import { Router } from "express";
import { handleContact, handleInvoice, handleVerification } from "../controllers/mailController.js";

// Une seule route POST /mail/contact pour centraliser les demandes du site vitrine.
const router = Router();

router.post("/contact", handleContact);
router.post("/verification", handleVerification);
router.post("/invoice", handleInvoice);

export default router;
