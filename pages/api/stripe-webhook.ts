import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import { prisma } from "@/lib/prisma";

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_SECRET_KEY_LIVE!
    : process.env.STRIPE_SECRET_KEY!;

const STRIPE_WEBHOOK_SECRET =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE!
    : process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export const config = { api: { bodyParser: false } };

const plans = [
  { name: "Starter", priceId: "price_1RrIlUL6CXOzW3xLQ7wMluxp", points: 100, amount: 99 },
  { name: "Pro", priceId: "price_1RrIlpL6CXOzW3xLzmC8tASO", points: 250, amount: 199 },
  { name: "Business", priceId: "price_1RrImfL6CXOzW3xLT7VDdKei", points: 600, amount: 399 },
];

async function emitFacturaOblio({ userId, amount, productName, billingInfo }: {
  userId: string;
  amount: number;
  productName: string;
  billingInfo: any; // model Prisma BillingInfo
}) {
  const client_id = process.env.OBLIO_CLIENT_ID!;
  const client_secret = process.env.OBLIO_CLIENT_SECRET!;
  const cifFirma = process.env.OBLIO_CIF_FIRMA!;
  const serieFactura = process.env.OBLIO_SERIE_FACTURA!;

  // Obține token Oblio
  const params = new URLSearchParams();
  params.append("client_id", client_id);
  params.append("client_secret", client_secret);

  const tokenRes = await fetch("https://www.oblio.eu/api/authorize/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });

  if (!tokenRes.ok) throw new Error("Nu s-a putut obține tokenul Oblio");
  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;

  // Construiește clientData din billingInfo
  let clientData;
  if (billingInfo.type === "pj") {
    clientData = {
      cif: billingInfo.cui || "",
      name: billingInfo.companyName || "Firma client",
      address: billingInfo.address || "Adresa necunoscuta",
      city: billingInfo.city || "Localitate necunoscuta",
      state: billingInfo.county || "Județ necunoscut",
      email: billingInfo.email || "",
      vatPayer: 1,
    };
  } else {
    clientData = {
      cif: "",
      name: billingInfo.name || "Nume Client PF",
      address: billingInfo.address || "Adresa necunoscuta",
      city: billingInfo.city || "Localitate necunoscuta",
      state: billingInfo.county || "Județ necunoscut",
      email: billingInfo.email || "",
      vatPayer: 0,
    };
  }

  // Construiește facturaData
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
    internalNote: "Factura generata automat dupa plata Stripe",
  };

  // Trimite factura la Oblio
  const facturaRes = await fetch("https://www.oblio.eu/api/docs/invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(facturaData),
  });

  const rawResponse = await facturaRes.text();
  console.log("[Oblio] Răspuns brut factură:", rawResponse);

  const data = JSON.parse(rawResponse);
  if (data.status !== 200) {
    throw new Error(data.statusMessage || "Eroare la emiterea facturii");
  }
  console.log(`[Oblio] Factura generata pentru user ${userId}, link: ${data.data.link}`);
  return data.data.link;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig!, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email = session.customer_email || session.metadata?.email;
    const priceId = session.metadata?.priceId;
    const quantity = Number(session.metadata?.quantity) || 1;

    if (!email || !priceId) {
      console.log("[Stripe] ❌ Email sau priceId lipsă!");
      return res.status(400).json({ error: "Email sau priceId lipsă" });
    }

    const plan = plans.find((p) => p.priceId === priceId);
    if (!plan) {
      console.log("[Stripe] ❌ Plan necunoscut!");
      return res.status(400).json({ error: "Plan necunoscut" });
    }

    const puncte = plan.points * quantity;
    const amount = plan.amount * quantity;
    const productName = plan.name;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("[Stripe] ❌ User inexistent");
      return res.status(400).json({ error: "User inexistent" });
    }

    // Adaugă puncte
    await prisma.user.update({
      where: { email },
      data: { credits: { increment: puncte } },
    });
    console.log(`[Stripe] ✅ Adăugat ${puncte} puncte pentru ${email}`);

    // Preia billingInfo
    const billingInfo = await prisma.billingInfo.findUnique({
      where: { userId: user.id },
    });

    if (!billingInfo) {
      console.log("[Stripe] ❌ Lipsesc datele de facturare pentru user");
      return res.status(400).json({ error: "Lipsește billing info" });
    }

    try {
      const facturaLink = await emitFacturaOblio({ userId: user.id, amount, productName, billingInfo });
      console.log("[Oblio] Factură emisă cu succes:", facturaLink);
    } catch (error: any) {
      console.error("[Oblio] Eroare la emiterea facturii:", error.message || error);
    }
  }

  return res.status(200).json({ received: true });
}
