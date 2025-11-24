import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ error: "Lipsesc datele necesare." });
    }

    const record = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res.status(400).json({ error: "Token invalid." });
    }

    if (record.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({ error: "Email-ul nu corespunde tokenului." });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Tokenul a expirat." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({
      where: { token },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Eroare resetare parolă:", err);
    return res.status(500).json({ error: "Eroare internă." });
  }
}
