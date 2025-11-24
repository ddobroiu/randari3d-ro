import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleToken, location } from "@/lib/google-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat." });

  // Primim ID-ul din baza noastră de date (historyId), nu operationName direct
  const { historyId } = req.body;
  
  if (!historyId) return res.status(400).json({ error: "ID lipsă." });

  // 1. Găsim înregistrarea în DB
  const record = await prisma.history.findUnique({
      where: { id: historyId },
      include: { user: true }
  });

  if (!record || !record.operationId || record.user.email !== session.user.email) {
      return res.status(404).json({ error: "Înregistrare invalidă." });
  }

  if (record.status === "completed") {
      return res.status(200).json({ status: "completed", output: record.imageUrl });
  }

  try {
    const token = await getGoogleToken();
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/${record.operationId}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    // 2. Verificăm dacă Google a terminat
    if (data.done) {
      if (data.error) {
        // A eșuat -> marcăm ca failed și dăm banii înapoi (opțional)
        await prisma.history.update({
            where: { id: historyId },
            data: { status: "failed", imageUrl: "error" }
        });
        // Refund credite
        await prisma.user.update({
            where: { id: record.userId },
            data: { credits: { increment: record.pointsUsed } }
        });
        
        return res.status(200).json({ status: "failed", error: data.error.message });
      }

      // SUCCES -> Extragem videoul
      const predictions = data.response?.videos || data.response?.candidates || [];
      const videoData = predictions[0];
      
      let finalUrl = "";
      if (videoData?.uri) finalUrl = videoData.uri;
      else if (videoData?.bytesBase64Encoded) finalUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;

      if (finalUrl) {
        // 3. Actualizăm baza de date cu rezultatul final
        await prisma.history.update({
            where: { id: historyId },
            data: { 
                status: "completed",
                imageUrl: finalUrl 
            }
        });
        return res.status(200).json({ status: "completed", output: finalUrl });
      }
    }

    // Încă lucrează
    return res.status(200).json({ status: "processing" });

  } catch (error: any) {
    console.error("Check Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
}