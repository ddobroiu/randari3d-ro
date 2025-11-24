import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const STRIPE_SECRET_KEY =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_SECRET_KEY_LIVE!
    : process.env.STRIPE_SECRET_KEY!;

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { priceId, quantity = 1, email } = req.body;
  if (!priceId || !email) {
    return res.status(400).json({ error: "Lipsesc datele necesare" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity }],
      mode: "payment",
      customer_email: email,
      success_url: `${BASE_URL}/dashboard?success=true`,
      cancel_url: `${BASE_URL}/dashboard?canceled=true`,
      metadata: {
        priceId,
        quantity,
        email,
      },
    });
    res.status(200).json({ sessionId: session.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
