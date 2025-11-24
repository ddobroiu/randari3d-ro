import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Trebuie să fii autentificat." });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "Promptul este necesar." });
  }

  try {
    // Înlocuiește VERSION cu modelul pe care îl folosești pe Replicate
    const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // Pune aici versiunea modelului tău Replicate!
        version: "0a1381936934845a14efcc9f309ce7d031cb905867878b5c5830280e00e97606",
        input: { prompt },
      }),
    });

    const prediction = await predictionRes.json();

    if (predictionRes.status !== 201) {
      console.error("❌ Eroare la generare:", prediction);
      return res.status(500).json({ error: "Generarea a eșuat.", detail: prediction });
    }

    const getUrl = prediction.urls.get;
    let output = null;

    for (let i = 0; i < 30; i++) {
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });

      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        output = pollData.output;
        break;
      } else if (pollData.status === "failed") {
        return res.status(500).json({ error: "Generarea a eșuat." });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!output) {
      return res.status(500).json({ error: "Fără rezultat după așteptare." });
    }

    // Salvează în istoric
    await prisma.history.create({
      data: {
        userId: user.id,
        imageUrl: Array.isArray(output) ? output[0] : output,
        prompt,
        robot: "image-text",
        pointsUsed: 5,
      },
    });

    return res.status(200).json({ result: { output } });
  } catch (err) {
    console.error("❌ Eroare API:", err);
    return res.status(500).json({ error: "Eroare internă server." });
  }
}
