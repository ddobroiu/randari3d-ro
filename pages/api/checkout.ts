// pages/api/checkout.ts
import type { NextApiRequest, NextApiResponse } from "next";

const plans = {
  starter: { price: 99, credits: 100 },
  pro: { price: 249, credits: 300 },
  business: { price: 499, credits: 700 },
} as const;

type PlanKey = keyof typeof plans;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { plan } = req.query;

  if (!plan || typeof plan !== "string" || !(plan in plans)) {
    return res.status(400).json({ error: "Plan invalid." });
  }

  const selected = plans[plan as PlanKey];

  // Aici ai putea integra Stripe în viitor
  // const session = await stripe.checkout.sessions.create({...})

  return res.status(200).json({
    message: `Simulare checkout pentru planul ${plan}`,
    credits: selected.credits,
    price: selected.price,
  });
}
