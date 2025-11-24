// /pages/api/user-credits.ts

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verificăm sesiunea
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.email) {
      return res.status(401).json({ success: false, error: "Neautorizat" });
    }

    // Căutăm utilizatorul în baza de date
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { credits: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "Utilizatorul nu a fost găsit" });
    }

    // Returnăm creditele
    return res.status(200).json({ success: true, credits: user.credits });
  } catch (error) {
    console.error("❌ Eroare /user-credits:", error);
    return res.status(500).json({ success: false, error: "Eroare server" });
  }
}
