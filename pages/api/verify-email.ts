import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.body.token?.trim();
    const email = req.body.email?.toLowerCase().trim();

    if (!token || !email) {
      return res.status(400).json({ error: "Lipsesc datele necesare" });
    }

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token },
    });

    if (!record) {
      return res.status(400).json({ error: "Token inexistent" });
    }

    if (record.email.toLowerCase() !== email) {
      return res.status(400).json({ error: "Email-ul nu corespunde tokenului" });
    }

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: "Tokenul a expirat" });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    });

    await prisma.emailVerificationToken.delete({
      where: { token },
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Eroare la verificarea emailului:", err);
    return res.status(500).json({ error: "Eroare internă" });
  }
}
