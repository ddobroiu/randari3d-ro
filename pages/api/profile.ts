// pages/api/profile.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: "Neautorizat" });
  }

  const userEmail = session.user.email;

  if (req.method === "GET") {
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        name: true,
        email: true,
        credits: true,
        createdAt: true,
      },
    });

    return res.status(200).json(user);
  }

  if (req.method === "POST") {
    const { name } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Nume invalid" });
    }

    await prisma.user.update({
      where: { email: userEmail },
      data: { name },
    });

    return res.status(200).json({ message: "Nume actualizat cu succes" });
  }

  return res.status(405).json({ error: "Metodă nepermisă" });
}
