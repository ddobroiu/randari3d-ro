import type { NextApiRequest, NextApiResponse } from "next";
import { getGoogleToken, projectId, location } from "@/lib/google-client";

export const config = { api: { bodyParser: true } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Metodă nepermisă" });

  try {
    const { messages } = req.body; 
    if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: "Format invalid." });

    const geminiContents = messages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
    }));

    const token = await getGoogleToken();
    
    // --- LISTA DE MODELE (FALLBACK SYSTEM) ---
    const modelsToTry = [
        "gemini-3-pro-preview",
        "gemini-1.5-pro-002",
        "gemini-1.5-flash-002",
        "gemini-1.0-pro-002"
    ];

    let successData = null;
    let lastError = null;

    for (const modelId of modelsToTry) {
        try {
            // console.log(`💬 Chat cu modelul: ${modelId}`);
            const endpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

            const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    contents: geminiContents,
                    generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
                })
            });

            if (!response.ok) throw new Error(await response.text());
            
            successData = await response.json();
            break; // Succes!

        } catch (err: any) {
            lastError = err;
        }
    }

    if (!successData) {
        throw new Error(`Chat failed on all models. Last error: ${lastError?.message}`);
    }

    const reply = successData.candidates?.[0]?.content?.parts?.[0]?.text || "Nu am înțeles.";
    return res.status(200).json({ reply });

  } catch (err: any) {
    console.error("Eroare Chat:", err);
    return res.status(500).json({ error: "Eroare server", details: err.message });
  }
}