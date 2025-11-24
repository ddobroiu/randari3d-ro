// pages/api/forgot-password.ts
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { NextApiRequest, NextApiResponse } from "next";
import { sendResetEmail } from "@/lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email lipsă" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(200).json({ message: "Dacă emailul există, vei primi un link." });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minute

  await prisma.passwordResetToken.create({
    data: { email, token, expiresAt: expires },
  });

  await sendResetEmail(email, token); // ✅ DOAR token, nu resetUrl

  res.status(200).json({ message: "Dacă emailul există, vei primi un link." });
}
