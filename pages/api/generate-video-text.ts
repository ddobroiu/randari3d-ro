// pages/api/generate-video-from-text.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Neautorizat" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt-ul este necesar pentru generarea video-ului." });
  }

  try {
    const replicateRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "5bc6f0b2e1c4691df02f3ea18957537d1e099a32a81a1e4b393b55ba72b5b80d", // ← Exemplu de model real
        input: { prompt },
      }),
    });

    const replicateData = await replicateRes.json();
    if (!replicateData.id) {
      return res.status(500).json({ error: "Eroare la inițierea generării." });
    }

    // Polling (așteptăm generarea)
    let output = null;
    const pollUrl = replicateData.urls.get;

    for (let i = 0; i < 60; i++) {
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });

      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        output = pollData.output?.[0];
        break;
      } else if (pollData.status === "failed") {
        return res.status(500).json({ error: "Generarea a eșuat." });
      }

      await new Promise((r) => setTimeout(r, 2000));
    }

    if (!output) {
      return res.status(500).json({ error: "Timeout – fără rezultat." });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });
    }

    await prisma.history.create({
      data: {
        userId: user.id,
        imageUrl: output,
        prompt,
        robot: "video-from-text",
        pointsUsed: 15, // poți ajusta după caz
      },
    });

    return res.status(200).json({ videoUrl: output });
  } catch (error) {
    console.error("Eroare internă:", error);
    return res.status(500).json({ error: "Eroare internă la generare." });
  }
}
