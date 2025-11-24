import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // ✅ corect acum
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ corect

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("❌ Eroare server:", error);
    res.status(500).json({ error: "Eroare server" });
  }
}
