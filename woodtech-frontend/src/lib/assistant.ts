// Client pour discuter avec le microservice AI assistant (backend).
export type AssistantAuthor = "user" | "assistant";

export type AssistantMessage = {
  role: AssistantAuthor;
  content: string;
};

// Erreur specialisee pour differencier les problemes (cle manquante, appel reseau, etc.).
export class AssistantError extends Error {
  code: "missing_endpoint" | "request_failed";

  constructor(message: string, code: "missing_endpoint" | "request_failed" = "request_failed") {
    super(message);
    this.name = "AssistantError";
    this.code = code;
  }
}

const ASSISTANT_BASE_URL =
  (import.meta.env.VITE_ASSISTANT_SERVICE_URL as string | undefined)?.trim() ||
  "http://localhost:3007";

import { notifyServiceDown } from "./serviceStatus";

type AssistantApiResponse =
  | { success: true; data: { reply: string } }
  | { success: false; error: { message: string } };

export async function askAssistant(messages: AssistantMessage[]): Promise<string> {
  if (!ASSISTANT_BASE_URL) {
    throw new AssistantError("Assistant endpoint not configured", "missing_endpoint");
  }

  const history = messages.slice(-6); // keep recent context to stay within limits

  let response: Response;
  try {
    response = await fetch(`${ASSISTANT_BASE_URL}/assistant/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history })
    });
  } catch (error) {
    notifyServiceDown({ service: "assistant" });
    throw new AssistantError(
      error instanceof Error ? error.message : "Assistant indisponible.",
      "request_failed"
    );
  }

  const rawText = await response.text();

  if (!response.ok) {
    let message = "Unable to reach the assistant service.";
    try {
      const parsed = JSON.parse(rawText);
      if (parsed?.error?.message) message = parsed.error.message;
    } catch {
      if (rawText) message = rawText;
    }
    if (response.status >= 500 || response.status === 404) {
      notifyServiceDown({ service: "assistant" });
    }
    throw new AssistantError(message);
  }

  let payload: AssistantApiResponse;
  try {
    payload = JSON.parse(rawText) as AssistantApiResponse;
  } catch (error) {
    throw new AssistantError(error instanceof Error ? error.message : "Invalid response payload.");
  }

  if (!payload.success) {
    notifyServiceDown({ service: "assistant" });
    throw new AssistantError(payload.error?.message || "Assistant error.");
  }

  if (!payload.data?.reply) {
    notifyServiceDown({ service: "assistant" });
    throw new AssistantError("Assistant responded without content.");
  }

  return payload.data.reply;
}
