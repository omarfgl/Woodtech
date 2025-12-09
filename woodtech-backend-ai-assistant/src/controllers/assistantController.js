import { z } from "zod";
import { askAssistant } from "../lib/openaiClient.js";
import { badRequest } from "../utils/httpError.js";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1, "Le message ne peut pas être vide")
});

const requestSchema = z.object({
  messages: z.array(messageSchema).min(1, "Au moins un message est requis"),
  prompt: z.string().trim().optional()
});

// Controller unique pour le chat IA.
export async function handleChat(req, res, next) {
  try {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success) {
      const message = parsed.error.issues.map((issue) => issue.message).join(", ");
      throw badRequest(message);
    }

    const { messages, prompt } = parsed.data;
    const reply = await askAssistant(messages, prompt);

    res.json({
      success: true,
      data: {
        reply
      }
    });
  } catch (error) {
    next(error);
  }
}
