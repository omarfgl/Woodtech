import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/animate-ui/components/buttons/button";
import { useTranslate } from "@/lib/i18n";
import { useAuth } from "../store/auth";

type VerificationState = "checking" | "success" | "error";

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const [searchParams] = useSearchParams();
  const translate = useTranslate();
  const hasVerified = useRef(false);
  const [state, setState] = useState<VerificationState>("checking");

  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }
    hasVerified.current = true;

    if (!email || !token) {
      setState("error");
      return;
    }

    verifyEmail(email, token)
      .then(() => {
        setState("success");
      })
      .catch((error) => {
        console.error(error);
        setState("error");
      });
  }, [email, token, verifyEmail]);

  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <section className="container max-w-lg py-16">
      <h1 className="text-3xl font-semibold">{translate("verifyEmail.title")}</h1>
      <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-5">
        {state === "checking" && (
          <p className="text-sm text-white/70">{translate("verifyEmail.checking")}</p>
        )}
        {isSuccess && (
          <>
            <h2 className="text-xl font-semibold text-white">
              {translate("verifyEmail.successTitle")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {translate("verifyEmail.successMessage")}
            </p>
          </>
        )}
        {isError && (
          <>
            <h2 className="text-xl font-semibold text-white">
              {translate("verifyEmail.errorTitle")}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {translate("verifyEmail.errorMessage")}
            </p>
          </>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          {isSuccess && (
            <Button as={Link} to="/" variant="primary" size="sm" className="rounded-lg">
              {translate("verifyEmail.home")}
            </Button>
          )}
          {isError && (
            <Button
              as={Link}
              to="/inscription"
              variant="primary"
              size="sm"
              className="rounded-lg"
            >
              {translate("verifyEmail.register")}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
