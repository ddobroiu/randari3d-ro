import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { sendVerificationEmail } from "@/lib/mail";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, name, password, ref } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ error: "Toate câmpurile sunt obligatorii" });
    }

    // Verifică dacă emailul există deja
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email deja folosit" });
    }

    // Găsește referentul (ID sau email)
    let referrer: { id: string } | null = null;
    if (ref) {
      referrer = await prisma.user.findFirst({
        where: {
          OR: [{ id: ref }, { email: ref }]
        },
        select: { id: true }, // ← Adaugă acest select!
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Creează userul
    await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        credits: 0,
        referrerId: referrer ? referrer.id : null,
      },
    });

    // Dă puncte referentului dacă există
    if (referrer) {
      await prisma.user.update({
        where: { id: referrer.id },
        data: { credits: { increment: 50 } },
      });
    }

    // Generează și salvează token de verificare email
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    await prisma.emailVerificationToken.create({
      data: {
        email: email.toLowerCase().trim(),
        token,
        expiresAt,
      },
    });

    await sendVerificationEmail(email, token);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Eroare la înregistrare:", err);
    return res.status(500).json({ error: "Eroare internă la înregistrare" });
  }
}
