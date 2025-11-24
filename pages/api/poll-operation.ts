import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma"; // Avem nevoie de prisma pentru a salva istoricul la final
import { getGoogleToken, location } from "@/lib/google-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat." });

  const { operationName, prompt } = req.body;
  if (!operationName) return res.status(400).json({ error: "Operation Name lipsă." });

  try {
    const token = await getGoogleToken();
    // Endpoint generic pentru operațiuni în Vertex AI
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/${operationName}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // Verificăm dacă e gata
    if (data.done) {
      if (data.error) {
        return res.status(500).json({ status: "failed", error: data.error.message });
      }

      // Extragem video-ul (Google returnează de obicei un URI sau base64 în response)
      // Structura Veo: response.result.videos[0].bytesBase64Encoded sau uri
      // Notă: Structura exactă poate varia, facem o verificare defensivă
      const predictions = data.response?.videos || data.response?.candidates || [];
      const videoData = predictions[0];
      
      let finalUrl = null;

      if (videoData?.uri) {
        finalUrl = videoData.uri; // GCS URI
      } else if (videoData?.bytesBase64Encoded) {
        // Dacă primim Base64, îl facem Data URI pentru frontend
        finalUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
      }

      if (finalUrl) {
        // Salvăm în istoric doar când e gata cu succes
        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (user) {
             await prisma.history.create({
                data: {
                    userId: user.id,
                    imageUrl: "video-generated", // Sau un placeholder, deoarece base64 e prea mare pt DB uneori
                    // Ideal ar fi să salvăm video-ul în S3/Uploadthing și să punem link-ul aici
                    // Pentru MVP returnăm base64 direct la user
                    prompt: prompt || "Video Veo",
                    robot: "video-image",
                    pointsUsed: 25,
                }
            });
        }
        
        return res.status(200).json({ status: "succeeded", output: finalUrl });
      } else {
         return res.status(500).json({ status: "failed", error: "Format răspuns Google necunoscut." });
      }
    }

    // Dacă nu e gata ("done": false sau lipsă)
    return res.status(200).json({ status: "processing" });

  } catch (error: any) {
    console.error("Polling Error:", error);
    return res.status(500).json({ error: error.message });
  }
}