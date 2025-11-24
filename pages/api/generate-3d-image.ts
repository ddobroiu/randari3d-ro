// pages/api/generate-3d.ts
import { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import Replicate from "replicate";
import { getToken } from "next-auth/jwt";

export const config = {
  api: {
    bodyParser: false,
  },
};

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
  userAgent: "my-3d-generator",
  fetch: async (url, options: any = {}) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  },
});

const parseForm = (req: NextApiRequest): Promise<{ files: formidable.Files; fields: formidable.Fields }> => {
  const form = formidable({ multiples: false });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = await getToken({ req });
  if (!token) {
    return res.status(401).json({ error: "Neautorizat" });
  }

  try {
    const { files } = await parseForm(req);
    const file = files.image as File | File[];

    const filePath =
      (Array.isArray(file) ? file[0]?.filepath : file?.filepath) ||
      (Array.isArray(file) ? file[0]?.originalFilename : file?.originalFilename);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(400).json({ error: "Fișier lipsă sau invalid." });
    }

    const buffer = fs.readFileSync(filePath);
    const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    const prediction = await replicate.predictions.create({
      version: "e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c",
      input: {
        images: [base64Image],
        generate_model: true,
        generate_color: true,
        generate_normal: false,
      },
      wait: true,
    });

    const output = prediction.output as any;
    const videoUrl = output?.combined_video || output?.color_video || null;
    const modelUrl = output?.model_file || null;

    if (!videoUrl && !modelUrl) {
      return res.status(500).json({ error: "Modelul nu a returnat video sau fișier 3D." });
    }

    return res.status(200).json({ video: videoUrl, model: modelUrl });
  } catch (error: any) {
    console.error("❌ Eroare Replicate:", error?.response?.data || error.message);
    return res.status(500).json({ error: "Eroare la generarea modelului 3D." });
  }
}
