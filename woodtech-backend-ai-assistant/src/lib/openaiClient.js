import config from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

const extractTextFromResponse = (payload) => {
  if (payload && typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload?.output)) {
    const text = payload.output
      .flatMap((item) => {
        if (Array.isArray(item.content)) {
          return item.content
            .filter((entry) => typeof entry.text === "string" && entry.text.trim())
            .map((entry) => entry.text.trim());
        }
        if (typeof item.text === "string" && item.text.trim()) {
          return [item.text.trim()];
        }
        return [];
      })
      .join("\n")
      .trim();

    if (text) return text;
  }

  return "";
};

export async function askAssistant(messages, systemPrompt) {
  if (!config.openAi.apiKey) {
    throw new HttpError("Missing OpenAI API key", 500);
  }

  const history = Array.isArray(messages) ? messages.slice(-6) : [];
  const payload = {
    model: config.openAi.model,
    input: [
      { role: "system", content: systemPrompt || config.openAi.systemPrompt },
      ...history.map((message) => ({
        role: message.role,
        content: message.content
      }))
    ]
  };

  const response = await fetch(config.openAi.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openAi.apiKey}`
    },
    body: JSON.stringify(payload)
  });

  const raw = await response.text();

  if (!response.ok) {
    let message = "Unable to reach the assistant service.";
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.error?.message) {
        message = parsed.error.message;
      }
    } catch {
      if (raw) message = raw;
    }
    throw new HttpError(message, response.status);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new HttpError(error instanceof Error ? error.message : "Invalid response payload", 500);
  }

  const text = extractTextFromResponse(parsed);
  if (!text) {
    throw new HttpError("Assistant responded without content", 502);
  }

  return text;
}
