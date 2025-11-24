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

  let base64Image = "";
  let mimeType = "image/jpeg";

  try {
    // 1. Pregătire Imagine
    if (req.headers["content-type"]?.includes("application/json")) {
        const body = await new Promise<any>((resolve, reject) => {
            let data = "";
            req.on("data", (chunk) => (data += chunk));
            req.on("end", () => resolve(JSON.parse(data || "{}")));
            req.on("error", reject);
        });
        if (!body.imageUrl) return res.status(400).json({ error: "Lipsește imageUrl" });
        const imgRes = await fetch(body.imageUrl);
        const arrayBuffer = await imgRes.arrayBuffer();
        base64Image = Buffer.from(arrayBuffer).toString("base64");
        mimeType = imgRes.headers.get("content-type") || "image/jpeg";
    } else {
        const uploadDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
        const form = new IncomingForm({ uploadDir, keepExtensions: true });
        const { files } = await parseForm(req, form);
        const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file; // Fix pentru numele câmpului 'file' vs 'image'
        const actualFile = uploadedFile || (Array.isArray(files.image) ? files.image[0] : files.image);

        if (!actualFile) return res.status(400).json({ error: "Nicio imagine primită." });
        base64Image = fs.readFileSync(actualFile.filepath, "base64");
        mimeType = actualFile.mimetype || "image/jpeg";
    }

    const token = await getGoogleToken();
    
    // --- LISTA DE MODELE (FALLBACK SYSTEM) ---
    // Încercăm pe rând până merge unul
    const modelsToTry = [
        "gemini-3-pro-preview",       // 1. Ce vrei tu
        "gemini-1.5-pro-002",         // 2. Cel mai bun stabil
        "gemini-1.5-flash-002",       // 3. Cel mai rapid stabil
        "gemini-1.0-pro-vision-001"   // 4. Ultimul resort (clasic)
    ];

    const promptText = `
      You are an interior design expert. Analyze this image.
      Identify the 4-5 most important furniture or decor items visible.
      For each item, generate a specific search term in ROMANIAN.
      Respond ONLY with a valid JSON: { "items": [ { "name": "Canapea", "query": "canapea gri moderna" } ] }
    `;

    let lastError = null;
    let successData = null;

    for (const modelId of modelsToTry) {
        try {
            console.log(`🔍 Încerc analiză cu modelul: ${modelId}...`);
            const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { text: promptText },
                            { inline_data: { mime_type: mimeType, data: base64Image } }
                        ]
                    }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
                })
            });

            if (!response.ok) {
                const txt = await response.text();
                if (response.status === 404) throw new Error(`Model ${modelId} not found (404)`);
                throw new Error(`API Error: ${txt}`);
            }

            successData = await response.json();
            console.log(`✅ Succes cu modelul: ${modelId}`);
            break; // Am reușit, ieșim din buclă

        } catch (err: any) {
            console.warn(`⚠️ ${modelId} a eșuat:`, err.message);
            lastError = err;
        }
    }

    if (!successData) {
        throw new Error(`Toate modelele au eșuat. Ultima eroare: ${lastError?.message}`);
    }

    const textResponse = successData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) throw new Error("AI-ul nu a returnat text.");

    const cleanJson = textResponse.replace(/```json|```/g, '').trim();
    const analysis = JSON.parse(cleanJson);

    return res.status(200).json({ success: true, analysis: analysis });

  } catch (error: any) {
    console.error("Eroare Finală Analiză:", error);
    return res.status(500).json({ error: error.message });
  }
}