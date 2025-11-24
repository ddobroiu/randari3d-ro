import type { NextApiRequest, NextApiResponse } from "next";
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

  const uploadDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
  const form = new IncomingForm({ uploadDir, keepExtensions: true });

  try {
    const { files } = await parseForm(req, form);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file?.filepath) return res.status(400).json({ error: "Imagine lipsă." });

    const buffer = fs.readFileSync(file.filepath);
    const base64Image = buffer.toString("base64");
    const mimeType = file.mimetype || "image/jpeg";
    const token = await getGoogleToken();

    // FIX: Folosim modelul stabil generic, disponibil global
    const modelId = "gemini-1.5-flash"; 
    
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    const prompt = `
      Ești un expert în design interior și shopping. Analizează această imagine.
      Identifică cele mai importante 4-5 piese de mobilier sau decor vizibile.
      Pentru fiecare piesă, generează un termen de căutare scurt și precis în limba ROMÂNĂ pentru a găsi produse similare într-un magazin online.
      
      Exemple: "canapea catifea verde", "lustră modernă aurie", "fotoliu galben", "covor geometric".
      
      Răspunde DOAR cu un JSON valid în acest format:
      {
        "items": [
          { "name": "Canapea", "query": "canapea coltar gri modern" },
          { "name": "Masuta", "query": "masuta cafea sticla" }
        ]
      }
    `;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2
        }
      })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Gemini Error: ${err}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) throw new Error("Nu s-a primit analiză de la AI.");

    const analysis = JSON.parse(textResponse);

    return res.status(200).json({ success: true, analysis: analysis });

  } catch (error: any) {
    console.error("Eroare Analiză:", error);
    return res.status(500).json({ error: error.message });
  }
}