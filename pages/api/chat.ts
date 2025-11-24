import type { NextApiRequest, NextApiResponse } from "next";
import { getGoogleToken, projectId, location } from "@/lib/google-client";
import fs from "fs";
import path from "path";

export const config = { api: { bodyParser: true } };

function writeLog(line: string) {
    try {
        const tmpDir = path.join(process.cwd(), "tmp");
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        fs.appendFileSync(path.join(tmpDir, "chat.log"), `[${new Date().toISOString()}] ${line}\n`);
    } catch (e) {}
}

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
    writeLog(`token_present=${Boolean(token)} messages=${messages.length}`);
    
        // --- Determinăm modelele disponibile în publisher 'google' și construim lista de încercare ---
        const desiredModels = [
                "gemini-3-pro-preview",
                "gemini-1.5-pro-002",
                "gemini-1.5-flash-002",
                "gemini-1.0-pro-002"
        ];

        let modelsToTry: string[] = [];
        try {
            const listEndpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models`;
            const listResp = await fetch(listEndpoint, { method: 'GET', headers: { Authorization: `Bearer ${token}` } });
            const listText = await listResp.text().catch(() => "");
            if (listResp.ok) {
                const listData = JSON.parse(listText || "{}");
                const available = (listData.models || []).map((m: any) => String(m.name).split('/').pop());
                writeLog(`available_models=${available.join(',')}`);
                // Keep only desired models that are available
                modelsToTry = desiredModels.filter(m => available.includes(m));
                // If none of desired models available, try a few available ones
                if (modelsToTry.length === 0) {
                    modelsToTry = available.slice(0, 4);
                }
            } else {
                writeLog(`model_list_error status=${listResp.status} body=${listText.substring(0,1000)}`);
            }
        } catch (e: any) {
            writeLog(`model_list_exception ${String(e?.message||e)}`);
        }

        // Fallback: if still empty, use a broad stable model
        if (!modelsToTry || modelsToTry.length === 0) modelsToTry = ["text-bison@001"];

        let successData: any = null;
        let lastError: any = null;

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

            const text = await response.text().catch(()=>"<no-body>");
            writeLog(`model=${modelId} status=${response.status} body=${text.substring(0,1000)}`);
            if (!response.ok) throw new Error(text);
            
            successData = JSON.parse(text || "{}");
            break; // Succes!

        } catch (err: any) {
            lastError = err;
            writeLog(`model_error model=${modelId} message=${String(err?.message||err)}`);
        }
    }

    if (!successData) {
        throw new Error(`Chat failed on all models. Last error: ${String(lastError?.message || lastError)}`);
    }

    const reply = (successData as any)?.candidates?.[0]?.content?.parts?.[0]?.text || "Nu am înțeles.";
    return res.status(200).json({ reply });

  } catch (err: any) {
    console.error("Eroare Chat:", err);
    return res.status(500).json({ error: "Eroare server", details: err.message });
  }
}