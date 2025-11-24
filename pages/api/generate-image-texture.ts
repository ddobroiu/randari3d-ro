import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// 🛠️ Fix pt import default/corect la formidable v3+
import formidable from "formidable";

// ⚙️ Disable bodyParser
export const config = {
  api: { bodyParser: false },
};

// 📦 Funcție utilitară pt parsare form
async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const uploadDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

  const form = formidable({
    uploadDir,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: "Trebuie să fii autentificat pentru a genera." });
  }

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return res.status(404).json({ error: "Utilizatorul nu a fost găsit." });

  try {
    const { fields, files } = await parseForm(req);

    const file = Array.isArray(files.image) ? files.image[0] : files.image;
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;

    if (!file?.filepath || !prompt) {
      return res.status(400).json({ error: "Imaginea și promptul sunt necesare." });
    }

    const base64Image = fs.readFileSync(file.filepath, "base64");

    const predictionRes = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "0a1381936934845a14efcc9f309ce7d031cb905867878b5c5830280e00e97606",
        input: {
          input_image: `data:image/png;base64,${base64Image}`,
          prompt: prompt,
        },
      }),
    });

    const prediction = await predictionRes.json();

    if (predictionRes.status !== 201) {
      console.error("❌ Eroare la generare:", prediction);
      return res.status(500).json({ error: "Generarea a eșuat.", detail: prediction });
    }

    const getUrl = prediction.urls.get;
    let output = null;

    for (let i = 0; i < 30; i++) {
      const pollRes = await fetch(getUrl, {
        headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
      });

      const pollData = await pollRes.json();

      if (pollData.status === "succeeded") {
        output = pollData.output;
        break;
      } else if (pollData.status === "failed") {
        console.error("❌ Generare eșuată:", pollData);
        return res.status(500).json({ error: "Generarea a eșuat." });
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (!output) {
      return res.status(500).json({ error: "Fără rezultat după așteptare." });
    }

    await prisma.history.create({
      data: {
        userId: user.id,
        imageUrl: output,
        prompt,
        robot: "image-texture",
        pointsUsed: 10,
      },
    });

    return res.status(200).json({ result: { output } });
  } catch (error) {
    console.error("❌ Eroare internă:", error);
    return res.status(500).json({ error: "Eroare internă server." });
  }
}
