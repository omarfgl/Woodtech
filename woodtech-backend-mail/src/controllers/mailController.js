import { z } from "zod";
import { sendMail } from "../lib/mailer.js";

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
