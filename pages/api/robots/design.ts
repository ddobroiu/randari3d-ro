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
    
    const style = Array.isArray(fields.style) ? fields.style[0] : "";
    const userPrompt = Array.isArray(fields.prompt) ? fields.prompt[0] : "";
    
    // Prompt optimizat pentru Gemini 3 Pro
    const fullPrompt = `Redesign this room in a ${style} style. ${userPrompt}. Keep the architectural structure but change materials, furniture and lighting to match the style. Photorealistic, 8k, interior design magazine quality.`;

    if (!file?.filepath) return res.status(400).json({ error: "Imagine lipsă." });

    const pointsUsed = 10;
    if (user.credits < pointsUsed) return res.status(403).json({ error: "Credite insuficiente." });

    await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: pointsUsed } } });

    const buffer = fs.readFileSync(file.filepath);
    const base64Image = buffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";
    const token = await getGoogleToken();

    // FOLOSIM GEMINI 3 PRO IMAGE PREVIEW
    const modelId = "gemini-3-pro-image-preview"; 
    // Dacă nu merge în regiunea ta, încearcă "gemini-2.5-flash-image" ca backup
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: fullPrompt },
              { 
                inline_data: { 
                  mime_type: mimeType, 
                  data: base64Image 
                } 
              }
            ]
          }
        ],
        generationConfig: {
            responseModalities: ["IMAGE"], // Cerem doar imagine
            candidateCount: 1,
            // Putem adăuga parametri specifici dacă documentația permite (temperature, etc.)
        }
      })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Google Error:", err);
        await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: pointsUsed } } });
        throw new Error(`Google Refused: ${response.statusText} (Vezi consola server)`);
    }

    const data = await response.json();
    
    // Gemini returnează imaginile în candidates[0].content.parts
    // Trebuie să găsim partea care conține inline_data (imaginea)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inline_data);

    if (!imagePart || !imagePart.inline_data) {
        console.error("Google Response:", JSON.stringify(data, null, 2));
        throw new Error("Nu s-a generat imagine (posibil filtru de siguranță).");
    }

    const finalUrl = `data:${imagePart.inline_data.mime_type};base64,${imagePart.inline_data.data}`;

    await prisma.history.create({
        data: {
            userId: user.id,
            imageUrl: finalUrl,
            prompt: fullPrompt,
            robot: "design",
            pointsUsed: pointsUsed,
            status: "completed"
        }
    });

    return res.status(200).json({ result: { output: finalUrl } });

  } catch (error: any) {
    console.error("Eroare Design:", error);
    return res.status(500).json({ error: error.message });
  }
}