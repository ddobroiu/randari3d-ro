import nodemailer from "nodemailer";

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

// ✅ Verificare email nou
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  await sendMail(email, "✅ Verifică-ți adresa de email", `
    <h2>Salut!</h2>
    <p>Apasă pe link pentru a-ți verifica contul:</p>
    <a href="${verifyUrl}" style="color: #2563eb;">${verifyUrl}</a>
  `);
}

// ✅ Resetare parolă
export async function sendResetEmail(email: string, token: string) {
  const resetUrl = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  await sendMail(email, "🔑 Resetare parolă", `
    <h2>Salut!</h2>
    <p>Apasă pe link pentru a reseta parola:</p>
    <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
  `);
}

// 🔄 Funcție comună de trimitere email
async function sendMail(to: string, subject: string, htmlContent: string) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    console.error("❌ Lipsesc variabile de mediu pentru email.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    // In development you might be using SMTP servers with self-signed
    // certificates. Allow opting out of cert verification when explicitly
    // enabled via `SMTP_ALLOW_SELF_SIGNED=true` or when not in production.
    tls: {
      rejectUnauthorized: !(process.env.SMTP_ALLOW_SELF_SIGNED === "true" || process.env.NODE_ENV !== "production"),
    },
  });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html: `
        <div style="font-family: sans-serif; color: #333;">
          ${htmlContent}
          <br /><br />
          <p>Cu respect,<br />Echipa Randări 3D</p>
        </div>
      `,
    });

    console.log(`✅ Email trimis către ${to}`);
  } catch (err: any) {
    console.error("❌ Eroare la trimiterea emailului:", err.message);
  }
}
