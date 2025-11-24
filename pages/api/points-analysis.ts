import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const userId = session.user.id;

  try {
    // Total puncte folosite
    const total = await prisma.history.aggregate({
      _sum: { pointsUsed: true },
      where: { userId },
    });

    // Puncte pe zile (ultimele 7), extrase manual
    const last7 = await prisma.history.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 100, // luam mai multe pentru siguranță
    });

    // Grupăm pe zi
    const groupedByDay: Record<string, number> = {};
    last7.forEach((entry) => {
      const date = entry.createdAt.toISOString().split("T")[0]; // format yyyy-mm-dd
      groupedByDay[date] = (groupedByDay[date] || 0) + (entry.pointsUsed || 0);
    });

    const daily = Object.entries(groupedByDay)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .slice(-7);

    // Cel mai folosit robot
    const topRobot = await prisma.history.groupBy({
      by: ["robot"],
      where: { userId },
      _count: { robot: true },
      orderBy: { _count: { robot: "desc" } },
      take: 1,
    });

    // ✅ Răspuns compatibil cu Dashboard.tsx
    res.status(200).json({
      total: total._sum.pointsUsed || 0,
      daily,
      mostUsedRobot: topRobot[0]?.robot || "N/A",
    });
  } catch (error) {
    console.error("Eroare analiză puncte:", error);
    res.status(500).json({ error: "Eroare server." });
  }
}
