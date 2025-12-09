import { Resend } from "resend";
import config from "../config/env.js";
import nodemailer from "nodemailer";

// Client Resend pre-initialise avec les secrets du service.
const resend = new Resend(config.resendApiKey);
const resendFallbackFrom = "WoodTech <onboarding@resend.dev>";

// Transport SMTP (Gmail) si email/pass sont fournis.
let smtpTransport = null;
if (config.smtp) {
  smtpTransport = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

// Envoi effectif d'un email : on ne gere qu'une destination unique pour l'instant.
export async function sendMail({ subject, text, html, to }) {
  try {
    const recipients = to && to.length ? to : [config.mail.to];
    if (smtpTransport) {
      const result = await smtpTransport.sendMail({
        from: config.mail.from,
        to: recipients,
        subject,
        text,
        html,
      });
      console.info("[mailer] SMTP send success", { to: recipients, subject });
      return result;
    }
    try {
      const result = await resend.emails.send({
        from: config.mail.from,
        to: recipients,
        subject,
        text,
        html,
      });
      console.info("[mailer] Resend primary send success", { to: recipients, subject });
      return result;
    } catch (error) {
      console.error("[mailer] Resend primary from failed, falling back to onboarding@resend.dev", {
        subject,
        to: recipients,
        error,
      });
      const resultFallback = await resend.emails.send({
        from: resendFallbackFrom,
        to: recipients,
        subject,
        text,
        html,
      });
      console.info("[mailer] Resend fallback send success", { to: recipients, subject });
      return resultFallback;
    }
  } catch (error) {
    console.error("[mailer] Failed to send email", { subject, to, error });
    throw error;
  }
}

export default resend;
