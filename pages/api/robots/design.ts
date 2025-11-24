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
    
    const fullPrompt = `Redesign this room in a ${style} style. ${userPrompt}. Maintain the perspective and architectural structure perfectly. Replace furniture and decor to match the style. Render in 8k resolution, photorealistic quality, interior design magazine style, perfect lighting, sharp details.`;

    if (!file?.filepath) return res.status(400).json({ error: "Imagine lipsă." });

    const pointsUsed = 10;
    if (user.credits < pointsUsed) return res.status(403).json({ error: "Credite insuficiente." });

    await prisma.user.update({ where: { id: user.id }, data: { credits: { decrement: pointsUsed } } });

    const buffer = fs.readFileSync(file.filepath);
    const base64Image = buffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";
    const token = await getGoogleToken();

    const apiVersion = "v1beta1";
    const modelId = "gemini-2.5-flash-image";
    const endpoint = `https://${location}-aiplatform.googleapis.com/${apiVersion}/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

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
            responseModalities: ["IMAGE"],
            candidateCount: 1,
            temperature: 0.4
        }
      })
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("Google Error:", err);
        await prisma.user.update({ where: { id: user.id }, data: { credits: { increment: pointsUsed } } });
        throw new Error(`Google Refused: ${response.status} - ${err}`);
    }

    const data = await response.json();
    
    // --- FIX PENTRU PARSARE ---
    const parts = data.candidates?.[0]?.content?.parts || [];
    
    // Căutăm imaginea verificând ambele tipuri de chei (camelCase sau snake_case)
    const imagePart = parts.find((p: any) => 
        (p.inlineData && p.inlineData.mimeType?.startsWith("image/")) || 
        (p.inline_data && p.inline_data.mime_type?.startsWith("image/"))
    );

    if (!imagePart) {
        console.error("Gemini Response (No Image):", JSON.stringify(data, null, 2));
        throw new Error("Gemini a răspuns, dar nu a generat imaginea.");
    }

    // Extragem datele corecte
    const imgMime = imagePart.inlineData?.mimeType || imagePart.inline_data?.mime_type;
    const imgData = imagePart.inlineData?.data || imagePart.inline_data?.data;

    const finalUrl = `data:${imgMime};base64,${imgData}`;

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