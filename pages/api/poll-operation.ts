import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleToken, location } from "@/lib/google-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat." });

  const { historyId } = req.body;
  if (!historyId) return res.status(400).json({ error: "ID lipsă." });

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
  if (record.status === "failed") {
      return res.status(200).json({ status: "failed", error: "Generare eșuată anterior." });
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

    if (!response.ok) {
        throw new Error(`Google API Error: ${response.status}`);
    }

    const data = await response.json();

    if (data.done) {
      if (data.error) {
        await prisma.history.update({
            where: { id: historyId },
            data: { status: "failed", imageUrl: "error" }
        });
        await prisma.user.update({
            where: { id: record.userId },
            data: { credits: { increment: record.pointsUsed } }
        });
        
        return res.status(200).json({ status: "failed", error: data.error.message });
      }

      const predictions = data.response?.videos || data.response?.candidates || [];
      const videoData = predictions[0];
      
      // FIX: Definim explicit tipul variabilei
      let finalUrl: string | null = null;
      
      if (videoData?.uri) {
          finalUrl = videoData.uri;
      } else if (videoData?.bytesBase64Encoded) {
          finalUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
      }

      if (finalUrl) {
        await prisma.history.update({
            where: { id: historyId },
            data: { 
                status: "completed",
                imageUrl: finalUrl 
            }
        });
        return res.status(200).json({ status: "completed", output: finalUrl });
      } else {
          return res.status(500).json({ status: "failed", error: "Output format unknown" });
      }
    }

    return res.status(200).json({ status: "processing" });

  } catch (error: any) {
    console.error("Check Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
}