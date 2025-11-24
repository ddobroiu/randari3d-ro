// pages/api/history-latest.ts

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat" });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) return res.status(404).json({ error: "User inexistent" });

  const history = await prisma.history.findMany({   // 🔄 aici era eroarea!
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  res.status(200).json(history);
}
