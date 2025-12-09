import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../store/auth";
import { useTranslate } from "@/lib/i18n";
import { isAxiosError } from "axios";
import { Button } from "@/components/animate-ui/components/buttons/button";

const createRegisterSchema = (translate: ReturnType<typeof useTranslate>) =>
  z
    .object({
      name: z.string().trim().min(2, translate("register.validation.name")),
      email: z.string().trim().email(translate("register.validation.email")),
      password: z
        .string()
        .min(8, translate("register.validation.password")),
      confirm: z.string()
    })
    .refine((data) => data.password === data.confirm, {
      path: ["confirm"],
      message: translate("register.validation.confirm")
    });

type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

// Formulaire d'inscription avec double validation (front + API).
export default function RegisterPage() {
  const { register, status, verifyEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const translate = useTranslate();
  const registerSchema = useMemo(
    () => createRegisterSchema(translate),
    [translate]
  );

  const [values, setValues] = useState<RegisterValues>({
    name: "",
    email: "",
    password: "",
    confirm: ""
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof RegisterValues, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const reason = searchParams.get("reason");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const mapped: Partial<Record<keyof RegisterValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        mapped[issue.path[0] as keyof RegisterValues] = issue.message;
      });
      setErrors(mapped);
      return;
    }
    try {
      const result = await register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password
      });
      setPendingEmail(result.email);
      setCode("");
      setCodeError(null);
    } catch (error) {
      console.error(error);
      if (isAxiosError(error) && error.response?.status === 409) {
        setFormError("Cet email est déjà enregistré. Connectez-vous ou utilisez un autre email.");
      } else if (isAxiosError(error) && error.response?.data?.error?.message) {
        setFormError(error.response.data.error.message);
      } else {
        setFormError(translate("register.form.error"));
      }
    }
  };

  const handleVerify = async () => {
    if (!pendingEmail) return;
    if (!code || code.length !== 6) {
      setCodeError("Code invalide");
      return;
    }
    setCodeError(null);
    setVerifying(true);
    setFormError(null);
    try {
      await verifyEmail(pendingEmail, code);
      navigate("/", { replace: true });
    } catch (error) {
      console.error(error);
      setCodeError("Code invalide ou expiré");
      setVerifying(false);
    }
  };

  const handleChange =
    (field: keyof RegisterValues) =>
    (value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    };

  return (
    <section className="container max-w-lg py-16">
      <h1 className="text-3xl font-semibold">{translate("register.title")}</h1>
      <p className="mt-2 text-sm text-white/60">
        {translate("register.subtitle")}
      </p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        {reason === "auth" && (
          <div className="rounded-lg border border-brand-400/40 bg-brand-500/10 p-3 text-sm text-brand-50">
            {translate("auth.required")}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-white">
            {translate("register.form.nameLabel")}
          </label>
          <input
            id="name"
            value={values.name}
            onChange={(event) => handleChange("name")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("register.form.namePlaceholder")}
            required
          />
          {errors.name && (
            <p className="text-xs text-red-200">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-white">
            {translate("register.form.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange("email")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("register.form.emailPlaceholder")}
            required
          />
          {errors.email && (
            <p className="text-xs text-red-200">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-white">
            {translate("register.form.passwordLabel")}
          </label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) => handleChange("password")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("register.form.passwordPlaceholder")}
            required
          />
          {errors.password && (
            <p className="text-xs text-red-200">{errors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm" className="text-sm font-medium text-white">
            {translate("register.form.confirmLabel")}
          </label>
          <input
            id="confirm"
            type="password"
            value={values.confirm}
            onChange={(event) => handleChange("confirm")(event.target.value)}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("register.form.confirmPlaceholder")}
            required
          />
          {errors.confirm && (
            <p className="text-xs text-red-200">{errors.confirm}</p>
          )}
        </div>
        {formError && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
            {formError}
          </div>
        )}
        <Button
          type="submit"
          className="w-full rounded-lg"
          variant="primary"
          size="md"
          disabled={status === "loading"}
          fullWidth
        >
          {status === "loading"
            ? translate("register.form.submitLoading")
            : translate("register.form.submit")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-white/70">
        {translate("register.loginPrompt")}{" "}
        <Link
          to="/connexion"
          className="text-brand-200 underline-offset-4 hover:underline"
        >
          {translate("register.loginLink")}
        </Link>
      </p>

      {pendingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-2xl bg-brand-900 p-6 shadow-xl border border-white/10">
            <h2 className="text-xl font-semibold text-white">Vérifier votre email</h2>
            <p className="mt-2 text-sm text-white/70">
              Un code a été envoyé à <span className="font-semibold text-white">{pendingEmail}</span>. Saisissez-le pour activer votre compte.
            </p>
            <div className="mt-4 space-y-2">
              <label className="text-sm text-white/80">Code de vérification</label>
              <input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-center text-lg tracking-[0.3em] text-white focus:border-brand-400 focus:outline-none"
                placeholder="______"
                autoFocus
              />
              {codeError && <p className="text-xs text-red-200">{codeError}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                className="rounded-lg"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPendingEmail(null);
                  setCode("");
                  setCodeError(null);
                }}
                type="button"
              >
                Annuler
              </Button>
              <Button
                className="rounded-lg"
                variant="primary"
                size="sm"
                onClick={handleVerify}
                disabled={verifying}
                type="button"
              >
                {verifying ? "Vérification..." : "Valider"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
