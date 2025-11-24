import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

// Poți apela cu ?email=adresa@exemplu.com sau ?userId=...
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, userId } = req.query;

  let user;

  if (email && typeof email === "string") {
    user = await prisma.user.findUnique({ where: { email } });
  } else if (userId && typeof userId === "string") {
    user = await prisma.user.findUnique({ where: { id: userId } });
  }

  if (!user) {
    return res.status(404).json({ error: "Utilizator inexistent." });
  }

  // Poți returna și lista de utilizatori aduși
  const referrals = await prisma.user.findMany({
    where: { referrerId: user.id },
    select: { id: true, email: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return res.status(200).json({
    count: referrals.length,
    referrals,
  });
}
