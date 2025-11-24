import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fetch from "node-fetch";

const client_id = process.env.OBLIO_CLIENT_ID!;
const client_secret = process.env.OBLIO_CLIENT_SECRET!;
const cifFirma = process.env.OBLIO_CIF_FIRMA!;
const serieFactura = process.env.OBLIO_SERIE_FACTURA!;

let oblioTokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken() {
  const now = Date.now();
  if (oblioTokenCache && oblioTokenCache.expiresAt > now) {
    return oblioTokenCache.token;
  }

  const params = new URLSearchParams();
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  const response = await fetch("https://www.oblio.eu/api/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Eroare obținere token Oblio: ${response.status} ${text}`);
  }

  const data = await response.json();
  if (!data.access_token) throw new Error("Token API INVALID: " + JSON.stringify(data));

  const token = data.access_token;
  const expiresIn = parseInt(data.expires_in, 10) || 3600;
  oblioTokenCache = { token, expiresAt: now + expiresIn * 1000 - 60000 };

  return token;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { userId, amount, productName, robot } = req.body;

    if (!userId || !amount || !productName) {
      return res.status(400).json({ error: "Lipsește userId, amount sau productName" });
    }

    // Preluăm datele facturare din baza ta
    const clientDataFromDB = await prisma.billingInfo.findUnique({
      where: { userId },
    });

    if (!clientDataFromDB) {
      return res.status(400).json({ error: "Datele de facturare nu sunt setate." });
    }

    const clientType = clientDataFromDB.type || "pf";

    let clientData: any;

    if (clientType === "pj") {
      clientData = {
        cif: clientDataFromDB.cui || "",
        name: clientDataFromDB.companyName || "Firma client",
        address: clientDataFromDB.address || "Adresa necunoscuta",
        city: clientDataFromDB.city || "Localitate necunoscuta",
        state: clientDataFromDB.county || "Județ necunoscut",
        email: clientDataFromDB.email || "",
        vatPayer: 1,
      };
    } else {
      clientData = {
        cif: "",
        name: clientDataFromDB.name || "Nume Client PF",
        address: clientDataFromDB.address || "Adresa necunoscuta",
        city: clientDataFromDB.city || "Localitate necunoscuta",
        state: clientDataFromDB.county || "Județ necunoscut",
        email: clientDataFromDB.email || "",
        vatPayer: 0,
      };
    }

    // Validare simplă pentru localitate și județ înainte de trimitere
    if (!clientData.city || clientData.city.trim().length === 0) {
      console.warn("[Emitere factura] Localitatea clientului este goală sau invalidă!");
    }
    if (!clientData.state || clientData.state.trim().length === 0) {
      console.warn("[Emitere factura] Județul clientului este gol sau invalid!");
    }

    if (process.env.NODE_ENV !== "production") {
      console.debug("[Emitere factura] Date client:", JSON.stringify(clientData, null, 2));
    }

    const facturaData = {
      cif: cifFirma,
      client: clientData,
      issueDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      seriesName: serieFactura,
      language: "RO",
      precision: 2,
      currency: "RON",
      products: [
        {
          name: productName,
          price: amount,
          measuringUnit: "buc",
          vatName: "Normala",
          vatPercentage: 19,
          vatIncluded: 0,
          quantity: 1,
          productType: "Serviciu",
        },
      ],
      issuerName: "Randari3D",
      internalNote: `Factura generata automat dupa plata. Robot: ${robot || "unknown"}`,
    };

    const token = await getAccessToken();

    const response = await fetch("https://www.oblio.eu/api/docs/invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(facturaData),
    });

    const rawResponse = await response.text();
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Oblio] Răspuns brut factură:", rawResponse);
    }

    const data = JSON.parse(rawResponse);
    if (data.status !== 200) {
      console.error("EROARE emitere factură:", data.statusMessage);
      return res.status(400).json({ error: data.statusMessage || "Eroare la emiterea facturii" });
    }

    const invoiceLink = data.data.link;

    // Salvează link factura în history (poți ajusta imageUrl/prompt/robot conform contextului tău)
    await prisma.history.create({
      data: {
        userId,
        imageUrl: "", // pune URL imagine generată, dacă ai, altfel lasă gol
        prompt: `Factura pentru ${productName}`,
        robot: robot || "",
        pointsUsed: 0,
        invoiceLink,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.debug(`[Oblio] Factura generata pentru user ${userId}, link: ${invoiceLink}`);
    }

    return res.status(200).json({ message: "Factura creata cu succes!", link: invoiceLink });
  } catch (err: any) {
    console.error("[Oblio] Eroare la emiterea facturii:", err);
    return res.status(500).json({ error: err.message || "Eroare server" });
  }
}
