import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeServiceStatus, type ServiceDownPayload } from "@/lib/serviceStatus";
import { useTranslate } from "@/lib/i18n";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/animate-ui/components/buttons/button";

export default function ServiceStatusBanner() {
  const translate = useTranslate();
  const [payload, setPayload] = useState<ServiceDownPayload | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeServiceStatus((next) => {
      setPayload(next);
    });
    return unsubscribe;
  }, []);

  const handleRetry = useCallback(async () => {
    if (!payload) return;
    if (!payload.onRetry) {
      window.location.reload();
      return;
    }
    try {
      setIsRetrying(true);
      await payload.onRetry();
      setPayload(null);
    } catch (error) {
      console.error("Retry failed", error);
    } finally {
      setIsRetrying(false);
    }
  }, [payload]);

  if (!payload) {
    return null;
  }

  const labels: Record<ServiceDownPayload["service"], string> = {
    gateway: "Passerelle API",
    catalogue: "Catalogue",
    orders: "Commandes",
    mail: "Service mail",
    admin: "Espace admin",
    assistant: "Assistant IA",
    unknown: "Service"
  };

  const friendlyName = labels[payload.service] ?? labels.unknown;

  const handleDismiss = () => {
    setPayload(null);
    navigate("/");
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="max-w-lg w-full rounded-2xl border border-red-500/40 bg-gradient-to-b from-brand-900 via-brand-900/95 to-brand-950 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-4 p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-200 border border-red-500/40">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.28em] text-red-200/90">
              {translate("serviceStatus.microserviceDown")}
            </p>
            <h3 className="text-xl font-semibold text-white">
              {friendlyName} temporairement indisponible
            </h3>
            <p className="text-sm text-white/70 leading-relaxed">
              Ce service est en cours de maintenance ou subit un incident. Nous travaillons à le rétablir rapidement. Merci de votre patience.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-white/10 bg-black/20 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="rounded-lg"
          >
            OK, je continue
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleRetry}
            disabled={isRetrying}
            className="rounded-lg"
          >
            {isRetrying ? "Nouvel essai..." : "Réessayer"}
          </Button>
        </div>
      </div>
    </div>
  );
}
