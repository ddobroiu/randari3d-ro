import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { prisma } from "@/lib/prisma";

const OBLIO_CLIENT_ID = process.env.OBLIO_CLIENT_ID || "";
const OBLIO_CLIENT_SECRET = process.env.OBLIO_CLIENT_SECRET || "";

let oblioTokenCache: { token: string; expiresAt: number } | null = null;

async function getOblioToken() {
  const now = Date.now();
  if (oblioTokenCache && oblioTokenCache.expiresAt > now) {
    return oblioTokenCache.token;
  }
  const form = new URLSearchParams();
  form.append("client_id", OBLIO_CLIENT_ID);
  form.append("client_secret", OBLIO_CLIENT_SECRET);

  const resp = await fetch("https://www.oblio.eu/api/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!resp.ok) {
    throw new Error("Nu s-a putut obține tokenul Oblio");
  }
  const data = await resp.json();
  const token = data.access_token;
  const expiresIn = parseInt(data.expires_in, 10) || 3600;
  oblioTokenCache = { token, expiresAt: now + expiresIn * 1000 - 60000 };
  return token;
}

async function fetchFirmaByCui(cui: string) {
  const token = await getOblioToken();
  const url = `https://www.oblio.eu/api/nomenclature/clients?cif=${encodeURIComponent(cui)}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!resp.ok) {
    throw new Error("Eroare la obținerea datelor firmei din Oblio");
  }
  const data = await resp.json();
  if (data.status !== 200 || !data.data || data.data.length === 0) {
    throw new Error("Firma nu a fost găsită în Oblio");
  }
  return data.data[0];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session?.user?.id || !session.user.email) {
      return res.status(401).json({ error: "Neautentificat" });
    }

    if (req.method === "GET") {
      const billing = await prisma.billingInfo.findUnique({
        where: { userId: session.user.id },
      });
      return res.status(200).json({ billing });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const { type = "pf", cui, name, address, city, county, email } = req.body;

      if (type === "pj") {
        if (!cui) {
          return res.status(400).json({ error: "Completează CUI-ul firmei!" });
        }

        // Opțional: poți verifica dacă firma există în Oblio, dar nu obligatoriu la salvare
        /*
        try {
          await fetchFirmaByCui(cui);
        } catch (error: any) {
          return res.status(400).json({ error: error.message || "Eroare la verificarea firmei." });
        }
        */

        // Salvăm doar CUI și email pentru PJ, restul date se completează la emitere factură din Oblio
        const billingData = {
          type: "pj",
          cui,
          companyName: null,
          name: null,
          address: null,
          city: null,
          county: null,
          email: email || "",
        };

        const billing = await prisma.billingInfo.upsert({
          where: { userId: session.user.id },
          update: billingData,
          create: { userId: session.user.id, ...billingData },
        });

        return res.status(200).json({ ok: true, billing });
      } else {
        if (!name || !address || !city || !county || !email) {
          return res.status(400).json({ error: "Completează toate câmpurile obligatorii pentru persoană fizică!" });
        }

        const billingData = {
          type: "pf",
          cui: null,
          companyName: null,
          name,
          address,
          city,
          county,
          email,
        };

        const billing = await prisma.billingInfo.upsert({
          where: { userId: session.user.id },
          update: billingData,
          create: { userId: session.user.id, ...billingData },
        });

        return res.status(200).json({ ok: true, billing });
      }
    }

    res.status(405).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Eroare server" });
  }
}
