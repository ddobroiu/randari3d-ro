// /pages/api/generate-video-from-image.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import formidable, { Fields, Files } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
  api: { bodyParser: false },
};

function parseForm(req: NextApiRequest, form: InstanceType<typeof formidable.IncomingForm>) {
  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Trebuie să fii autentificat." });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });

  const uploadDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const form = new formidable.IncomingForm({ uploadDir, keepExtensions: true });

  try {
    const { fields, files } = await parseForm(req, form);

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const duration = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration || "5";
    const quality = Array.isArray(fields.quality) ? fields.quality[0] : fields.quality || "standard";

    if (!file?.filepath || !prompt) {
      return res.status(400).json({ error: "Imaginea și promptul sunt necesare." });
    }

    const base64Image = fs.readFileSync(file.filepath, "base64");
    const mimeType = file.mimetype || "image/jpeg";

    let pointsUsed = 15;
    if (duration === "5" && quality === "pro") pointsUsed = 25;
    else if (duration === "10" && quality === "standard") pointsUsed = 30;
    else if (duration === "10" && quality === "pro") pointsUsed = 50;

    if (user.credits < pointsUsed) {
      return res.status(403).json({ error: "Nu ai suficiente credite." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: pointsUsed } },
    });

    // Apel API Replicate
    const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "97da1f6c1fae926420a16b3c538b778f7fc317b8a16b3750f6bc39b106747793",
        input: {
          start_image: `data:${mimeType};base64,${base64Image}`,
          prompt,
          fps: 24,
          motion: "pan",
          duration: Number(duration),
          quality,
        },
      }),
    });

    const textResponse = await predictionRes.text();
    console.log("Replicate API response (raw):", textResponse);

    let prediction;
    try {
      prediction = JSON.parse(textResponse);
    } catch (e) {
      console.error("Parsing error:", e);
      return res.status(500).json({ error: "Răspuns nevalid de la API Replicate", detail: textResponse });
    }

    if (predictionRes.status !== 201) {
      console.error("Eroare la generare:", prediction);
      return res.status(500).json({ error: "Generarea a eșuat.", detail: prediction });
    }

    const getUrl = prediction.urls.get;
    let output = null;

    for (let i = 0; i < 150; i++) {
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });
      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        output = pollData.output;
        break;
      } else if (pollData.status === "failed") {
        console.error("Generare eșuată:", pollData);
        return res.status(500).json({ error: "Generarea a eșuat." });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!output) return res.status(500).json({ error: "Fără rezultat după așteptare." });

    await prisma.history.create({
      data: {
        userId: user.id,
        imageUrl: output,
        prompt,
        robot: "video-image",
        pointsUsed,
      },
    });

    return res.status(200).json({ result: { output } });
  } catch (error) {
    console.error("Eroare internă:", error);
    return res.status(500).json({ error: "Eroare internă server.", detail: error });
  }
}
