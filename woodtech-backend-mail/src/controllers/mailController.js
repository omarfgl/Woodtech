import { z } from "zod";
import { sendMail } from "../lib/mailer.js";
import { buildInvoicePdf } from "../lib/invoicePdf.js";

// Validation des champs envoyes par les formulaires (nom, email ou telephone obligatoire).
const contactSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z
      .string()
      .email("Adresse e-mail invalide")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    phone: z
      .string()
      .min(5)
      .max(30)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    message: z.string().min(10).max(2000),
    company: z.string().max(120).optional(),
    locale: z.string().max(20).optional(),
    projectType: z.string().max(120).optional(),
    budget: z.string().max(120).optional(),
    subject: z.string().max(120).optional(),
    source: z.string().max(60).optional(),
    consent: z.boolean().optional(),
  })
  .refine(
    (data) =>
      Boolean(
        (data.email && data.email.length > 0) ||
          (data.phone && data.phone.length > 0),
      ),
    {
      message: "Merci d'indiquer un e-mail ou un numero de telephone.",
      path: ["email"],
    },
  );

const verificationSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  code: z.string().length(6)
});

const invoiceSchema = z.object({
  email: z.string().email(),
  name: z.string().max(120).optional(),
  orderId: z.string().max(80).optional(),
  currency: z.string().default("EUR"),
  total: z.number().nonnegative(),
  items: z
    .array(
      z.object({
        title: z.string(),
        qty: z.number().int().positive(),
        price: z.number().nonnegative(),
        total: z.number().nonnegative().optional()
      })
    )
    .min(1)
});

// Controleur principal : formate le mail en texte + HTML et delegue l'envoi a Resend.
export async function handleContact(req, res, next) {
  try {
    const payload = contactSchema.parse(req.body ?? {});
    const subject =
      payload.subject || `Nouvelle demande (${payload.source ?? "contact"})`;

    const textLines = [
      `Nom: ${payload.name}`,
      payload.email ? `Email: ${payload.email}` : null,
      payload.phone ? `Telephone: ${payload.phone}` : null,
      payload.company ? `Entreprise: ${payload.company}` : null,
      payload.projectType ? `Projet: ${payload.projectType}` : null,
      payload.budget ? `Budget estime: ${payload.budget}` : null,
      "",
      payload.message,
    ]
      .filter(Boolean)
      .join("\n");

    const html = `
      <h2>Nouvelle demande WoodTech</h2>
      <p><strong>Source :</strong> ${payload.source ?? "Formulaire site"}</p>
      <ul>
        <li><strong>Nom :</strong> ${payload.name}</li>
        ${payload.email ? `<li><strong>Email :</strong> ${payload.email}</li>` : ""}
        ${payload.phone ? `<li><strong>Téléphone :</strong> ${payload.phone}</li>` : ""}
        ${payload.company ? `<li><strong>Entreprise :</strong> ${payload.company}</li>` : ""}
        ${payload.projectType ? `<li><strong>Projet :</strong> ${payload.projectType}</li>` : ""}
        ${payload.budget ? `<li><strong>Budget estimé :</strong> ${payload.budget}</li>` : ""}
        ${payload.locale ? `<li><strong>Langue :</strong> ${payload.locale}</li>` : ""}
      </ul>
      <p><strong>Message :</strong></p>
      <p>${payload.message.replace(/\n/g, "<br/>")}</p>
    `;

    await sendMail({
      subject: `${subject} - ${payload.name}`,
      text: textLines,
      html,
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Payload invalide",
          details: error.flatten(),
        },
      });
    }
    next(error);
  }
}

// Genere un PDF de facture et l'envoie au client.
export async function handleInvoice(req, res, next) {
  try {
    const payload = invoiceSchema.parse(req.body ?? {});
    const pdf = await buildInvoicePdf({
      orderId: payload.orderId,
      customerName: payload.name,
      customerEmail: payload.email,
      items: payload.items,
      currency: payload.currency,
      total: payload.total
    });

    const subject = `Votre facture ${payload.orderId ?? "WoodTech"}`;
    const html = buildInvoiceHtml({
      name: payload.name,
      orderId: payload.orderId,
      total: payload.total,
      currency: payload.currency
    });

    await sendMail({
      to: [payload.email],
      subject,
      text: `Merci pour votre commande. Facture en piece jointe. Montant: ${payload.total.toFixed(
        2
      )} ${payload.currency}`,
      html,
      attachments: [
        {
          filename: `${payload.orderId ?? "woodtech-invoice"}.pdf`,
          content: pdf,
          contentType: "application/pdf"
        }
      ]
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Payload invalide",
          details: error.flatten()
        }
      });
    }
    next(error);
  }
}

// Template HTML email (inspiration bloc coloré)
function buildInvoiceHtml({ name, orderId, total, currency }) {
  const displayName = name || "WoodTech";
  const amount = `${total.toFixed(2)} ${currency}`;

  return `
  <div style="background:#f3f4f6;padding:32px;font-family:'Segoe UI',Arial,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#0f172a;border-radius:16px 16px 0 0;padding:24px 28px;color:#f8fafc;">
      <div style="font-size:12px;letter-spacing:2px;font-weight:700;text-transform:uppercase;color:#c08457;">WoodTech</div>
      <div style="font-size:22px;font-weight:700;margin-top:8px;">Votre facture est prête</div>
      <div style="font-size:13px;color:#cbd5e1;margin-top:6px;">${orderId ? `Facture ${orderId}` : "Facture WoodTech"}</div>
    </div>
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:0 0 16px 16px;padding:28px;box-shadow:0 12px 35px -18px rgba(15,23,42,0.45);">
      <p style="font-size:14px;color:#1f2937;margin:0 0 12px 0;">Bonjour ${displayName},</p>
      <p style="font-size:14px;color:#334155;margin:0 0 16px 0;">Merci pour votre commande. Vous trouverez ci-joint votre facture en PDF.</p>
      <div style="background:#0f172a;color:#f8fafc;border-radius:12px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div>
          <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#cbd5e1;">Montant</div>
          <div style="font-size:20px;font-weight:700;color:#ffffff;">${amount}</div>
        </div>
        <div style="background:#c08457;color:#0f172a;font-weight:700;font-size:12px;padding:10px 14px;border-radius:10px;">PDF en pièce jointe</div>
      </div>
      <p style="font-size:13px;color:#475569;margin:18px 0 8px 0;">Si vous avez des questions, répondez simplement à cet email ou contactez-nous sur contact@woodtech.fr.</p>
      <p style="font-size:13px;color:#64748b;margin:0;">L'équipe WoodTech</p>
    </div>
  </div>
  `;
}

// Envoie un email de verification lors de l'inscription client.
export async function handleVerification(req, res, next) {
  try {
    const payload = verificationSchema.parse(req.body ?? {});
    console.info("[mail] verification request", { email: payload.email });
    const subject = "Vérification de votre compte WoodTech";
    const greeting = payload.name ? `Bonjour ${payload.name},` : "Bonjour,";

    const text = `${greeting}

Merci de créer un compte WoodTech. Pour vérifier votre adresse e-mail, entrez ce code dans l'application :

Code de vérification : ${payload.code}

Ce code expirera sous peu. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.`;

    const html = `
      <p>${greeting}</p>
      <p>Merci de créer un compte WoodTech. Pour vérifier votre adresse e-mail, entrez ce code dans l'application :</p>
      <p style="font-size:20px;font-weight:bold;letter-spacing:4px;margin:16px 0;">${payload.code}</p>
      <p>Ce code expirera sous peu. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message.</p>
    `;

    await sendMail({
      to: [payload.email],
      subject,
      text,
      html
    });
    console.info("[mail] verification sent", { email: payload.email });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Payload invalide",
          details: error.flatten()
        }
      });
    }
    next(error);
  }
}
