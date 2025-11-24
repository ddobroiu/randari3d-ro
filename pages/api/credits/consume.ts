import type { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

const secret = process.env.NEXTAUTH_SECRET;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = await getToken({ req, secret });

  if (!token || !token.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { amount } = req.body; // ⚡ primește amount din frontend
    const creditsToConsume = parseInt(amount) || 0;

    if (!creditsToConsume || creditsToConsume <= 0) {
      return res.status(400).json({ error: "Valoare invalidă pentru amount" });
    }

    const user = await prisma.user.findUnique({ where: { id: token.id } });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Perform an atomic conditional decrement: only decrement when credits >= amount.
    const result = await prisma.user.updateMany({
      where: { id: user.id, credits: { gte: creditsToConsume } },
      data: { credits: { decrement: creditsToConsume } },
    });

    if ((result as any).count === 0) {
      // No rows updated -> not enough credits (race-safe)
      return res.status(403).json({ error: `Nu ai suficiente credite (${creditsToConsume} necesare).` });
    }

    // Read the updated value to return the real remaining credits
    const refreshed = await prisma.user.findUnique({ where: { id: user.id } });
    return res.status(200).json({ success: true, remaining: refreshed?.credits ?? 0 });
  } catch (error) {
    console.error("❌ Eroare server:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
