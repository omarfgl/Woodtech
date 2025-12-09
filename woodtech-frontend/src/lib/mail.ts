import { notifyServiceDown } from "./serviceStatus";

export type ContactMailPayload = {
  name: string;
  email?: string;
  phone?: string;
  message: string;
  source?: string;
};

const MAIL_SERVICE_URL = (
  import.meta.env.VITE_MAIL_SERVICE_URL ?? "http://localhost:4500"
).replace(/\/$/, "");

// Appel POST vers le microservice mail (Resend). On remonte une erreur claire si l'envoi echoue.
export async function sendContactMessage(payload: ContactMailPayload) {
  let response: Response;
  try {
    response = await fetch(`${MAIL_SERVICE_URL}/mail/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    notifyServiceDown({ service: "mail" });
    throw error;
  }

  const data = await response
    .json()
    .catch(() => ({ success: false, error: { message: "Unknown error" } }));

  if (!response.ok || data?.success === false) {
    const errorMessage =
      data?.error?.message || "Unable to send message. Please try again later.";
    throw new Error(errorMessage);
  }

  return data;
}

export type InvoiceItemPayload = {
  title: string;
  qty: number;
  price: number;
  total?: number;
};

export type InvoiceMailPayload = {
  email: string;
  name?: string;
  orderId?: string;
  currency?: string;
  total: number;
  items: InvoiceItemPayload[];
};

// Envoie une facture PDF via le microservice mail.
export async function sendInvoiceEmail(payload: InvoiceMailPayload) {
  let response: Response;
  try {
    response = await fetch(`${MAIL_SERVICE_URL}/mail/invoice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    notifyServiceDown({ service: "mail" });
    throw error;
  }

  const data = await response.json().catch(() => ({ success: false }));
  if (!response.ok || data?.success === false) {
    const message = data?.error?.message || "Unable to send invoice email.";
    throw new Error(message);
  }
  return data;
}
