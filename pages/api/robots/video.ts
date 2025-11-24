import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncomingForm, Fields, Files } from "formidable";
import fs from "fs";
import path from "path";
import { getGoogleToken, projectId, location } from "@/lib/google-client";

export const config = { api: { bodyParser: false } };

function parseForm(req: NextApiRequest, form: IncomingForm) {
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
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat." });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "User inexistent." });

  const uploadDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  try {
    const { fields, files } = await parseForm(req, form);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    let duration = parseInt(Array.isArray(fields.duration) ? fields.duration[0] || "4" : fields.duration || "4");
    if (![4, 8].includes(duration)) duration = 4;

    if (!file?.filepath || !prompt) return res.status(400).json({ error: "Imagine și prompt necesare." });

    const pointsUsed = duration === 8 ? 25 : 15;
    if (user.credits < pointsUsed) return res.status(403).json({ error: "Credite insuficiente." });

    await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: pointsUsed } } });

    const buffer = fs.readFileSync(file.filepath);
    const base64Image = buffer.toString("base64");
    
    const token = await getGoogleToken();
    // Endpoint Veo Fast
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/veo-3.1-fast-generate-001:predictLongRunning`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        instances: [{ prompt, image: { bytesBase64Encoded: base64Image, mimeType: "image/jpeg" } }],
        parameters: { sampleCount: 1, durationSeconds: duration, aspectRatio: "16:9", personGeneration: "allow_adult" }
      })
    });

    if (!response.ok) {
        const err = await response.text();
        await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: pointsUsed } } });
        throw new Error(`Google Refused: ${err}`);
    }

    const data = await response.json();
    
    // Salvăm Processing
    await prisma.history.create({
        data: {
            userId: user.id,
            imageUrl: "",
            prompt: prompt,
            robot: "video",
            pointsUsed: pointsUsed,
            status: "processing",
            operationId: data.name
        }
    });

    return res.status(200).json({ success: true, message: "Generare începută." });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}