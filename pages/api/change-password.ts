import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat" });

  // Acceptă și JSON și FormData (dar standard e JSON)
  const { current, newpass } = req.body;
  if (!current || !newpass) {
    return res.status(400).json({ error: "Completează toate câmpurile" });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "Utilizator inexistent" });

  const passwordMatch = await compare(current, user.password);
  if (!passwordMatch) return res.status(401).json({ error: "Parola actuală este greșită" });

  const hashed = await hash(newpass, 10);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  });

  return res.status(200).json({ message: "Parola a fost schimbată cu succes" });
}