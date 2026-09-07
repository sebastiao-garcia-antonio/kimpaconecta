import nodemailer from "nodemailer";

function obterConfiguracaoEmail() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;

  if (!host || !user || !password || !from) {
    return null;
  }

  return { host, port, user, password, from };
}

export async function enviarEmail(destinatario: string, assunto: string, mensagem: string) {
  const config = obterConfiguracaoEmail();

  if (!config) {
    console.warn("[EMAIL] Configuração SMTP ausente. Email não enviado.");
    return { success: false, skipped: true };
  }

  const transportador = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  await transportador.sendMail({
    from: config.from,
    to: destinatario,
    subject: assunto,
    text: mensagem,
  });

  return { success: true };
}
