import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../store/auth";
import { useTranslate } from "@/lib/i18n";
import { sendContactMessage } from "@/lib/mail";
import { Button } from "@/components/animate-ui/components/buttons/button";

// Schema de validation adapte aux traductions pour afficher les bons messages d'erreur.
const createContactSchema = (translate: ReturnType<typeof useTranslate>) =>
  z.object({
    name: z.string().trim().min(2, translate("contact.validation.name")),
    email: z.string().trim().email(translate("contact.validation.email")),
    message: z
      .string()
      .trim()
      .min(20, translate("contact.validation.messageLength"))
  });

type ContactFormValues = z.infer<ReturnType<typeof createContactSchema>>;

// Formulaire de contact principal reliant le front au service mail.
export default function ContactPage() {
  const { user } = useAuth();
  const location = useLocation();
  const redirectTarget = `${location.pathname}${location.search}`;
  const navigate = useNavigate();
  const translate = useTranslate();
  const contactSchema = useMemo(() => createContactSchema(translate), [translate]);

  const [values, setValues] = useState<ContactFormValues>({
    name: "",
    email: "",
    message: ""
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormValues, string>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleChange = (key: keyof ContactFormValues) => (value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  // Validation avec Zod puis appel du microservice mail.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      navigate(`/inscription?reason=auth&redirect=${encodeURIComponent(redirectTarget)}`);
      return;
    }
    setSubmitted(false);
    setSubmitError(null);
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const map: Partial<Record<keyof ContactFormValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          map[issue.path[0] as keyof ContactFormValues] = issue.message;
        }
      });
      setErrors(map);
      setStatus("error");
      return;
    }
    setErrors({});
    setStatus("loading");
    try {
      await sendContactMessage({
        name: parsed.data.name,
        email: parsed.data.email,
        message: parsed.data.message,
        source: "contact-page"
      });
      setValues({ name: "", email: "", message: "" });
      setSubmitted(true);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setSubmitError(translate("contact.error"));
      setStatus("error");
    }
  };

  return (
    <section className="container max-w-3xl py-12">
      <h1 className="text-3xl font-semibold">{translate("contact.title")}</h1>
      <p className="mt-2 text-white/60">{translate("contact.subtitle")}</p>
      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-white">
            {translate("contact.form.nameLabel")}
          </label>
          <input
            id="name"
            name="name"
            value={values.name}
            onChange={(event) => handleChange("name")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("contact.form.namePlaceholder")}
            required
          />
          {errors.name && (
            <p className="text-xs text-red-200">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-white">
            {translate("contact.form.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={values.email}
            onChange={(event) => handleChange("email")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("contact.form.emailPlaceholder")}
            required
          />
          {errors.email && (
            <p className="text-xs text-red-200">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="message" className="text-sm font-medium text-white">
            {translate("contact.form.messageLabel")}
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            value={values.message}
            onChange={(event) => handleChange("message")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("contact.form.messagePlaceholder")}
            required
          />
          {errors.message && (
            <p className="text-xs text-red-200">{errors.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          variant="primary"
          size="md"
          className="rounded-lg"
        >
          {status === "loading"
            ? translate("common.loading")
            : translate("contact.form.submit")}
        </Button>
        {submitted && (
          <div className="rounded-lg border border-brand-500/40 bg-brand-500/10 p-4 text-sm text-brand-50">
            {translate("contact.success")}
          </div>
        )}
        {submitError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            {submitError}
          </div>
        )}
      </form>
    </section>
  );
}
