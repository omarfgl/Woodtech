import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { askAssistant, AssistantError, type AssistantMessage } from "@/lib/assistant";
import { useTranslate } from "@/lib/i18n";
import { Button } from "@/components/animate-ui/components/buttons/button";

type ChatMessage = AssistantMessage & {
  id: string;
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Interface de chat basique alimentant l'assistant IA.
export default function AssistantPage() {
  const translate = useTranslate();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTarget = `${location.pathname}${location.search}`;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Envoi d'une question a l'API (avec gestion des erreurs fonctionnelles).
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      navigate(`/inscription?reason=auth&redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    const question = input.trim();
    if (!question || isLoading) {
      return;
    }

    setError(null);

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content: question
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const answer = await askAssistant([...messages, userMessage]);
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: "assistant",
        content: answer
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (unknownError) {
      if (unknownError instanceof AssistantError && unknownError.code === "missing_endpoint") {
        setError(translate("assistant.error.missingKey"));
      } else if (unknownError instanceof Error) {
        setError(unknownError.message);
      } else {
        setError(translate("assistant.error.generic"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = Boolean(input.trim()) && !isLoading;

  return (
    <section className="container flex flex-col gap-6 py-10">
      <header className="max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-200">
          {translate("assistant.badge")}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {translate("assistant.title")}
        </h1>
        <p className="mt-2 text-white/70">{translate("assistant.subtitle")}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col rounded-2xl border border-white/10 bg-brand-950/70 backdrop-blur">
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.length === 0 && !isLoading ? (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-white/70">
                {translate("assistant.emptyState")}
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-brand-500 text-white"
                      : "bg-white/10 text-white/90"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading ? (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/70">
                  {translate("assistant.loading")}
                </div>
              </div>
            ) : null}
          </div>
          <form onSubmit={handleSubmit} className="space-y-3 border-t border-white/5 p-6">
            <label htmlFor="assistant-question" className="text-sm font-medium text-white/80">
              {translate("assistant.promptLabel")}
            </label>
            <textarea
              id="assistant-question"
              name="question"
              rows={3}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={translate("assistant.inputPlaceholder")}
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-brand-300 focus:outline-none"
            />
            {error ? (
              <p className="text-xs text-red-200">{error}</p>
            ) : (
              <p className="text-xs text-white/50">{translate("assistant.disclaimer")}</p>
            )}
            <div className="flex items-center justify-end gap-3">
              <Button
                type="submit"
                disabled={!canSubmit}
                variant="primary"
                size="md"
                className="rounded-lg"
              >
                {isLoading ? translate("assistant.sending") : translate("assistant.submit")}
              </Button>
            </div>
          </form>
        </div>

        <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/80">
          <h2 className="text-base font-semibold text-white">
            {translate("assistant.examplesTitle")}
          </h2>
          <ul className="space-y-3">
            <li className="rounded-xl border border-white/10 bg-brand-900/60 p-4">
              <p className="font-medium text-brand-100">
                {translate("assistant.example.quote.title")}
              </p>
              <p className="mt-2 text-white/70">
                {translate("assistant.example.quote.body")}
              </p>
            </li>
            <li className="rounded-xl border border-white/10 bg-brand-900/60 p-4">
              <p className="font-medium text-brand-100">
                {translate("assistant.example.material.title")}
              </p>
              <p className="mt-2 text-white/70">
                {translate("assistant.example.material.body")}
              </p>
            </li>
            <li className="rounded-xl border border-white/10 bg-brand-900/60 p-4">
              <p className="font-medium text-brand-100">
                {translate("assistant.example.delivery.title")}
              </p>
              <p className="mt-2 text-white/70">
                {translate("assistant.example.delivery.body")}
              </p>
            </li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
