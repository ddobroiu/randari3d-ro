// /pages/api/get-support-tickets.ts
import { prisma } from "@/lib/prisma";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ tickets });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Eroare la încărcarea mesajelor." });
  }
}
