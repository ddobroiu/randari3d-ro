import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

export const config = {
  api: { bodyParser: true }, // Primește JSON, nu form-data!
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Doar POST e permis" });

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Trimite tot istoricul conversației!" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-40",
      messages, // Array complet cu context
      max_tokens: 1000,
    });

    const aiReply = response.choices[0]?.message?.content || "Fără răspuns.";
    res.status(200).json({ reply: aiReply });
  } catch (err: any) {
    console.error("Eroare:", err);
    res.status(500).json({ error: "Eroare server", details: err.message });
  }
}
