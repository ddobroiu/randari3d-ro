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

  // Preluăm istoricul facturilor care au link valid
  const invoices = await prisma.history.findMany({
    where: {
      userId: user.id,
      invoiceLink: {
        not: null,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10, // poți schimba limita după nevoie
  });

  res.status(200).json(invoices);
}
