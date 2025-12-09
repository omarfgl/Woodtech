import dotenv from "dotenv";

dotenv.config();

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (value) => {
  if (!value) return ["*"];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
};

const config = {
  port: toNumber(process.env.PORT, 3007),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  isProduction: process.env.NODE_ENV === "production",
  openAi: {
    apiKey: process.env.OPENAI_API_KEY ?? "",
    endpoint: process.env.OPENAI_ENDPOINT ?? "https://api.openai.com/v1/responses",
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    systemPrompt:
      process.env.OPENAI_SYSTEM_PROMPT ??
      "You are WoodTech's virtual assistant. Answer questions about custom woodworking, WoodTech services, and provide helpful guidance in French or English depending on the user's message. Keep replies clear and concise."
  }
};

export default config;
