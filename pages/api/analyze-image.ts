import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File as FormidableFile } from "formidable";
import fs from "fs";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: false }, // suport pentru fișiere
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 🟣 1. Caz: imagine din robot (URL trimis ca JSON)
  if (req.headers["content-type"]?.includes("application/json")) {
    try {
      const body = await new Promise<any>((resolve, reject) => {
        let data = "";
        req.on("data", (chunk) => (data += chunk));
        req.on("end", () => resolve(JSON.parse(data || "{}")));
        req.on("error", reject);
      });

      const { imageUrl } = body;

      if (!imageUrl) {
        return res.status(400).json({ error: "Lipsește imageUrl" });
      }

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identifică obiectele și conceptele vizibile în imagine. Răspunde DOAR cu cuvinte cheie separate prin virgulă, fără propoziții.",
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 100,
      });

      const reply = aiResponse.choices[0]?.message?.content || "";
      const keywords = reply
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9,ăâîșț ]/gi, "")
        .toLowerCase()
        .split(/[,]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      return res.status(200).json({ keywords });
    } catch (error: any) {
      console.error("AI Error [imageUrl]:", error);
      return res.status(500).json({ error: "Eroare AI", detail: error?.message });
    }
  }

  // 🟣 2. Caz: upload manual
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Formidable error:", err);
      return res.status(400).json({ error: "Eroare la parsarea fișierului" });
    }

    const uploadedFile = Array.isArray(files.file)
      ? (files.file[0] as FormidableFile | undefined)
      : (files.file as FormidableFile | undefined);

    if (!uploadedFile) {
      return res.status(400).json({ error: "Nicio imagine nu a fost trimisă" });
    }

    try {
      const mime = uploadedFile.mimetype || "image/png";
      const imageData = fs.readFileSync(uploadedFile.filepath);

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identifică obiectele și conceptele vizibile în imagine. Răspunde DOAR cu cuvinte cheie separate prin virgulă, fără propoziții.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mime};base64,${imageData.toString("base64")}`,
                },
              },
            ],
          },
        ],
        max_tokens: 100,
      });

      const reply = aiResponse.choices[0]?.message?.content || "";
      const keywords = reply
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9,ăâîșț ]/gi, "")
        .toLowerCase()
        .split(/[,]+/)
        .map((k) => k.trim())
        .filter(Boolean);

      return res.status(200).json({ keywords });
    } catch (error: any) {
      console.error("AI Error [upload]:", error);
      return res.status(500).json({ error: "Eroare AI", detail: error?.message });
    }
  });
}
