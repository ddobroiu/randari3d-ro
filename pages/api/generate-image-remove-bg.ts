// pages/api/generate-image-remove-bg.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseForm } from "@/utils/parseForm";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Trebuie să fii autentificat pentru a genera." });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });

  const uploadDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  try {
    const { files } = await parseForm(req);

    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file?.filepath) {
      return res.status(400).json({ error: "Imaginea este necesară." });
    }

    const base64Image = fs.readFileSync(file.filepath, "base64");

    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
      return res.status(500).json({ error: "Tokenul REPLICATE nu este setat." });
    }

    const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "a029dff38972b5fda4ec5d75d7d1cd25aeff621d2cf4946a41055d7db66b80bc",
        input: {
          image: `data:image/png;base64,${base64Image}`,
        },
      }),
    });

    const prediction = await predictionRes.json();

    if (predictionRes.status !== 201) {
      console.error("❌ Eroare la generare:", prediction);
      return res.status(500).json({
        error: "Generarea a eșuat.",
        detail: prediction,
        status: predictionRes.status,
      });
    }

    const getUrl = prediction.urls.get;
    let output = null;

    for (let i = 0; i < 30; i++) {
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${apiToken}` },
      });

      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        output = pollData.output;
        break;
      } else if (pollData.status === "failed") {
        console.error("❌ Generare eșuată:", pollData);
        return res.status(500).json({ error: "Generarea a eșuat." });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!output) {
      return res.status(500).json({ error: "Fără rezultat după așteptare." });
    }

    fs.unlink(file.filepath, () => null); // cleanup

    await prisma.history.create({
      data: {
        userId: user.id,
        imageUrl: output,
        prompt: "",
        robot: "remove-bg",
        pointsUsed: 5,
      },
    });

    return res.status(200).json({ result: { output } });
  } catch (error: any) {
    console.error("❌ Eroare internă:", error);
    return res.status(500).json({ error: "Eroare internă server.", detail: error.message });
  }
}
