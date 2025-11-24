import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { IncomingForm, Fields, Files } from "formidable";
import fs from "fs";
import path from "path";
import { getGoogleToken, projectId, location } from "@/lib/google-client";

export const config = {
  api: { bodyParser: false },
};

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

  const form = new IncomingForm({ 
    uploadDir, 
    keepExtensions: true,
    allowEmptyFiles: false,
    minFileSize: 0 
  });

  try {
    const { fields, files } = await parseForm(req, form);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const durationInput = Array.isArray(fields.duration) ? fields.duration[0] : fields.duration || "4";

    if (!file?.filepath || !prompt) return res.status(400).json({ error: "Imagine și prompt necesare." });

    let duration = parseInt(durationInput);
    if (![4, 6, 8].includes(duration)) duration = 8;

    const pointsUsed = duration === 8 ? 25 : 15;

    if (user.credits < pointsUsed) return res.status(403).json({ error: "Credite insuficiente." });

    // Scădem creditele
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: pointsUsed } },
    });

    const buffer = fs.readFileSync(file.filepath);
    const base64Image = buffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";

    const token = await getGoogleToken();
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/veo-3.1-fast-generate-001:predictLongRunning`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        instances: [
          {
            prompt: prompt,
            image: {
              bytesBase64Encoded: base64Image,
              mimeType: mimeType
            }
          }
        ],
        parameters: {
          sampleCount: 1,
          durationSeconds: duration,
          aspectRatio: "16:9",
          personGeneration: "allow_adult"
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google API Error:", errorText);
      await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: pointsUsed } } });
      throw new Error(`Google a refuzat cererea: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const operationName = data.name;

    // SALVĂM ÎN DB CU STATUS "PROCESSING"
    // Utilizatorul va vedea acest item în Dashboard ca fiind "În lucru"
    await prisma.history.create({
        data: {
            userId: user.id,
            imageUrl: "", // Încă nu avem URL-ul, e în procesare
            prompt: prompt,
            robot: "video-image",
            pointsUsed: pointsUsed,
            status: "processing", // Status nou
            operationId: operationName // Cheia pentru verificare ulterioară
        }
    });

    return res.status(200).json({ 
      success: true, 
      operationName: operationName,
      message: "Generarea a început. Poți găsi rezultatul în Dashboard când e gata."
    });

  } catch (error: any) {
    console.error("Server Error:", error);
    return res.status(500).json({ error: error.message });
  }
}