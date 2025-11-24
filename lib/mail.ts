// Using Resend API exclusively for sending emails in development and production.
// Remove SMTP fallback to keep a single consistent mail provider.

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
  const { RESEND_API_KEY, EMAIL_FROM } = process.env;

  if (!RESEND_API_KEY || !EMAIL_FROM) {
    console.error("❌ RESEND_API_KEY și/sau EMAIL_FROM nu sunt setate în .env. Nu pot trimite email.");
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
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
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Resend API error:", res.status, text);
      return;
    }

    console.log(`✅ Email trimis către ${to} via Resend`);
  } catch (err: any) {
    console.error("❌ Eroare la trimiterea prin Resend:", err.message);
  }
}
