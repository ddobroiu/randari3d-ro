// ... (Importuri și boilerplate identic ca mai sus)
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
    const { fields } = await parseForm(req, form);
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const aspect = Array.isArray(fields.aspect) ? fields.aspect[0] : "1:1";

    if (!prompt) return res.status(400).json({ error: "Prompt necesar." });

    const pointsUsed = 5;
    if (user.credits < pointsUsed) return res.status(403).json({ error: "Credite insuficiente." });

    await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: pointsUsed } } });

    const token = await getGoogleToken();
    // Model Text-to-Image
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: aspect, personGeneration: "allow_adult" }
      })
    });

    if (!response.ok) {
        const err = await response.text();
        await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: pointsUsed } } });
        throw new Error(`Google Refused: ${err}`);
    }

    const data = await response.json();
    const predictions = data.predictions || [];
    if (!predictions[0]) throw new Error("Eroare generare.");

    const finalUrl = `data:image/png;base64,${predictions[0].bytesBase64Encoded}`;

    await prisma.history.create({
        data: {
            userId: user.id,
            imageUrl: finalUrl,
            prompt: prompt,
            robot: "create",
            pointsUsed: pointsUsed,
            status: "completed"
        }
    });

    return res.status(200).json({ result: { output: finalUrl } });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}