"use client";

import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { BadgeCheck } from "lucide-react";

const stripePromise = loadStripe(
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_LIVE!
    : process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!
);

const plans = [
  {
    name: "Starter",
    slug: "starter",
    points: 100,
    price: 99,
    priceId: "price_1RrIlUL6CXOzW3xLQ7wMluxp",
    recommended: false,
    benefits: [
      "Acces rapid la generări de imagini",
      "Suport pentru 3 tipuri de roboți",
      "Opțiuni de personalizare a generării",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    points: 250,
    price: 199,
    priceId: "price_1RrIlpL6CXOzW3xLzmC8tASO",
    recommended: true,
    benefits: [
      "Acces extins la generări video",
      "5 tipuri de roboți pentru diverse utilizări",
      "Creare rapidă de imagini de înaltă calitate",
    ],
  },
  {
    name: "Business",
    slug: "business",
    points: 600,
    price: 399,
    priceId: "price_1RrImfL6CXOzW3xLT7VDdKei",
    recommended: false,
    benefits: [
      "Generare nelimitată de imagini și video",
      "Acces complet la toți roboții avansați",
      "Suport premium și asistență prioritară",
    ],
  },
];

export default function Planuri() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStripeBuy = async (plan: typeof plans[number]) => {
    if (!session?.user?.email) {
      alert("Trebuie să fii autentificat!");
      return;
    }

    setLoading(plan.slug);

    // 1. Verifică dacă există date facturare complete
    const billingRes = await fetch("/api/billing-info");
    const billingData = await billingRes.json();

    const b = billingData.billing;
    const hasValidBilling =
      b &&
      ((b.type === "pj" && b.cui && b.email) ||
        (b.type === "pf" &&
          b.name &&
          b.address &&
          b.city &&
          b.county &&
          b.email));

    if (!hasValidBilling) {
      setLoading(null);
      alert(
        "Completează datele de facturare înainte de a cumpăra. Vei fi redirecționat către dashboard."
      );
      window.location.href = "/dashboard#billing";
      return;
    }

    // 2. Creare sesiune Stripe
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        priceId: plan.priceId,
        quantity: 1,
        email: session.user.email,
      }),
    });

    const { sessionId, error } = await res.json();

    setLoading(null);

    if (error || !sessionId) {
      alert(error || "Eroare la procesarea plății.");
      return;
    }

    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <>
      <Head>
        <title>Planuri de Creditare | Randări 3D AI</title>
        <meta
          name="description"
          content="Alege planul potrivit pentru generarea de imagini și video cu inteligență artificială. Vezi abonamentele, beneficii și prețurile pe Randări 3D."
        />
        {/* SEO TAGS */}
        <meta property="og:title" content="Planuri de Creditare | Randări 3D AI" />
        <meta property="og:description" content="Alege planul potrivit pentru generarea de imagini și video cu inteligență artificială. Vezi abonamentele, beneficii și prețurile pe Randări 3D." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/planuri" />
        <meta property="og:image" content="https://randari3d.ro/og-image-planuri.jpg" />
        <meta name="twitter:title" content="Planuri de Creditare | Randări 3D AI" />
        <meta name="twitter:description" content="Alege planul potrivit pentru generarea de imagini și video cu inteligență artificială. Vezi abonamentele, beneficii și prețurile pe Randări 3D." />
        <meta name="twitter:image" content="https://randari3d.ro/og-image-planuri.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/planuri" />
      </Head>

      <main className="min-h-screen bg-background text-foreground px-6 py-12 transition-colors">
        <h1 className="text-4xl font-extrabold mb-16 text-center">
          Planuri de Creditare
        </h1>
        <div className="max-w-7xl mx-auto grid gap-8 grid-cols-1 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={`relative bg-card border border-border rounded-2xl shadow-xl p-8 transition-all hover:shadow-2xl hover:border-primary ${
                plan.recommended ? "ring-2 ring-primary" : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute top-4 right-4 bg-primary text-white text-xs px-3 py-1 rounded-full uppercase font-semibold tracking-wide shadow-md">
                  Recomandat
                </div>
              )}
              <h2 className="text-2xl font-bold text-primary mb-2">
                {plan.name}
              </h2>
              <p className="text-muted-foreground mb-1 text-sm">
                {plan.points} puncte incluse
              </p>
              <p className="text-3xl font-bold text-foreground mb-6">
                {plan.price} lei
              </p>
              <ul className="text-sm text-muted-foreground mb-8 space-y-3">
                {plan.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <BadgeCheck className="w-4 h-4 text-green-500 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleStripeBuy(plan)}
                disabled={loading === plan.slug}
                className="block w-full text-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:opacity-90 transition"
              >
                {loading === plan.slug ? "Se procesează..." : "Cumpără cu Stripe"}
              </button>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}