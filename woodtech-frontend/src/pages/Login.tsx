import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../store/auth";
import { useTranslate } from "@/lib/i18n";
import { adminTokenStorage } from "@/admin/guard";
import { Button } from "@/components/animate-ui/components/buttons/button";

const ADMIN_EMAIL = "larmoire@gmail.com";
const ADMIN_PASSWORD = "Larmoire1234";
const ADMIN_TOKEN = "mock-admin-token";

// Schema de validation dynamique pour afficher les messages dans la bonne langue.
const createLoginSchema = (translate: ReturnType<typeof useTranslate>) =>
  z.object({
    email: z.string().trim().email(translate("login.validation.email")),
    password: z
      .string()
      .min(6, translate("login.validation.password"))
  });

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

// Ecran de connexion (utilisateurs classiques + jeton admin de demo).
export default function LoginPage() {
  const { login, status } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const translate = useTranslate();
  const loginSchema = useMemo(() => createLoginSchema(translate), [translate]);

  const [values, setValues] = useState<LoginValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginValues, string>>>(
    {}
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Soumission : validation Zod, appel API et redirection contextuelle.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormError(null);
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      const mapped: Partial<Record<keyof LoginValues, string>> = {};
      parsed.error.issues.forEach((issue) => {
        mapped[issue.path[0] as keyof LoginValues] = issue.message;
      });
      setErrors(mapped);
      return;
    }
    try {
      await login(parsed.data);
      const normalizedEmail = parsed.data.email.trim().toLowerCase();
      const isAdminCredentials =
        normalizedEmail === ADMIN_EMAIL && parsed.data.password === ADMIN_PASSWORD;

      if (isAdminCredentials) {
        adminTokenStorage.set(ADMIN_TOKEN);
        navigate("/admin", { replace: true });
        return;
      }

      adminTokenStorage.clear();
      const redirectTo = (location.state as { from?: string } | undefined)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (error) {
      console.error(error);
      setFormError(translate("login.form.error"));
      adminTokenStorage.clear();
    }
  };

  return (
    <section className="container max-w-md py-16">
      <h1 className="text-3xl font-semibold">{translate("login.title")}</h1>
      <p className="mt-2 text-sm text-white/60">{translate("login.subtitle")}</p>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-white">
            {translate("login.form.emailLabel")}
          </label>
          <input
            id="email"
            type="email"
            value={values.email}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, email: event.target.value }))
            }
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("login.form.emailPlaceholder")}
            required
          />
          {errors.email && (
            <p className="text-xs text-red-200">{errors.email}</p>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-white">
            {translate("login.form.passwordLabel")}
          </label>
          <input
            id="password"
            type="password"
            value={values.password}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, password: event.target.value }))
            }
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2 focus:border-brand-400 focus:outline-none"
            placeholder={translate("login.form.passwordPlaceholder")}
            required
          />
          {errors.password && (
            <p className="text-xs text-red-200">{errors.password}</p>
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
            ? translate("login.form.submitLoading")
            : translate("login.form.submit")}
        </Button>
      </form>
      <p className="mt-6 text-sm text-white/70">
        {translate("login.registerPrompt")}{" "}
        <Link
          to="/inscription"
          className="text-brand-200 underline-offset-4 hover:underline"
        >
          {translate("login.registerLink")}
        </Link>
      </p>
    </section>
  );
}
