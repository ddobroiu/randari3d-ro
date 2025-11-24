import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGoogleToken, location } from "@/lib/google-client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // 1. Securitate: Verificăm utilizatorul
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).json({ error: "Neautorizat." });

  // 2. Input: Primim ID-ul intrării din baza noastră de date (History ID)
  const { historyId } = req.body;
  if (!historyId) return res.status(400).json({ error: "ID lipsă." });

  // 3. Căutăm înregistrarea în DB
  const record = await prisma.history.findUnique({
      where: { id: historyId },
      include: { user: true }
  });

  // Validări: Să existe, să aibă Operation ID (de la Google) și să aparțină utilizatorului curent
  if (!record || !record.operationId || record.user.email !== session.user.email) {
      return res.status(404).json({ error: "Înregistrare invalidă." });
  }

  // Dacă e deja gata în baza noastră, nu mai întrebăm Google
  if (record.status === "completed") {
      return res.status(200).json({ status: "completed", output: record.imageUrl });
  }
  if (record.status === "failed") {
      return res.status(200).json({ status: "failed", error: "Generare eșuată anterior." });
  }

  try {
    // 4. Interogăm Google Vertex AI folosind Operation ID
    const token = await getGoogleToken();
    // operationId este de obicei calea completă: "projects/.../locations/.../operations/..."
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

    // 5. Verificăm câmpul "done"
    if (data.done) {
      // Caz: Eroare la Google (ex: Safety Filter, Server Error)
      if (data.error) {
        // Marcăm ca eșuat în DB
        await prisma.history.update({
            where: { id: historyId },
            data: { status: "failed", imageUrl: "error" }
        });
        
        // AUTOMAT: Returnăm creditele utilizatorului
        await prisma.user.update({
            where: { id: record.userId },
            data: { credits: { increment: record.pointsUsed } }
        });
        
        return res.status(200).json({ status: "failed", error: data.error.message });
      }

      // Caz: Succes -> Extragem rezultatul
      // Google returnează structuri diferite, verificăm variantele posibile
      const predictions = data.response?.videos || data.response?.candidates || [];
      const videoData = predictions[0];
      
      let finalUrl = "";
      
      if (videoData?.uri) {
          // Dacă e URI (Cloud Storage)
          finalUrl = videoData.uri;
      } else if (videoData?.bytesBase64Encoded) {
          // Dacă e video raw (Base64), îl formatăm pentru browser
          finalUrl = `data:video/mp4;base64,${videoData.bytesBase64Encoded}`;
      }

      if (finalUrl) {
        // Actualizăm DB cu link-ul final și status "completed"
        await prisma.history.update({
            where: { id: historyId },
            data: { 
                status: "completed",
                imageUrl: finalUrl 
            }
        });
        return res.status(200).json({ status: "completed", output: finalUrl });
      } else {
          // S-a terminat dar fără output clar (caz rar)
          return res.status(500).json({ status: "failed", error: "Output format unknown" });
      }
    }

    // 6. Dacă nu e gata ("done": false), spunem frontend-ului să mai aștepte
    return res.status(200).json({ status: "processing" });

  } catch (error: any) {
    console.error("Check Status Error:", error);
    return res.status(500).json({ error: error.message });
  }
}