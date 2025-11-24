// pages/planuri.tsx
"use client";

import { useSession } from "next-auth/react";
import Head from "next/head";
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

// Gestionăm cheia Stripe cu siguranță (evităm eroarea .match pe undefined)
const stripeKey =
  process.env.NODE_ENV === "production"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_LIVE
    : process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;

const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const plans = [
  {
    name: "Starter",
    slug: "starter",
    points: 100,
    price: 99,
    priceId: "price_1RrIlUL6CXOzW3xLQ7wMluxp",
    recommended: false,
    description: "Perfect pentru a testa platforma și proiecte mici.",
    benefits: [
      "Acces rapid la generări de imagini",
      "Suport pentru 3 tipuri de roboți",
      "Opțiuni de bază personalizare",
      "Export format standard",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    points: 250,
    price: 199,
    priceId: "price_1RrIlpL6CXOzW3xLzmC8tASO",
    recommended: true,
    description: "Cel mai popular pentru creatori și designeri.",
    benefits: [
      "Tot ce include Starter",
      "Acces extins la generări video",
      "5 tipuri de roboți versatili",
      "Prioritate la generare",
      "Calitate High-Definition",
    ],
  },
  {
    name: "Business",
    slug: "business",
    points: 600,
    price: 399,
    priceId: "price_1RrImfL6CXOzW3xLT7VDdKei",
    recommended: false,
    description: "Pentru agenții și volum mare de lucru.",
    benefits: [
      "Tot ce include Pro",
      "Generare nelimitată de imagini",
      "Acces complet la toți roboții avansați",
      "Suport premium dedicat",
      "Licență comercială extinsă",
    ],
  },
];

export default function Planuri() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleStripeBuy = async (plan: typeof plans[number]) => {
    // Verificare preliminară pentru cheia Stripe
    if (!stripePromise) {
      alert("Eroare: Cheia publică Stripe nu este configurată în fișierul .env");
      console.error("Missing Stripe Public Key");
      return;
    }

    if (!session?.user?.email) {
      alert("Trebuie să fii autentificat!");
      return;
    }

    setLoading(plan.slug);

    // 1. Verifică dacă există date facturare complete
    try {
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
          "Te rugăm să completezi datele de facturare înainte de a cumpăra."
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

      if (error || !sessionId) {
        setLoading(null);
        alert(error || "Eroare la procesarea plății.");
        return;
      }

      const stripe = await stripePromise;
      
      if (!stripe) {
        setLoading(null);
        alert("Eroare la inițializarea Stripe.");
        return;
      }

      await stripe.redirectToCheckout({ sessionId });
      setLoading(null); // Resetăm loading doar dacă redirect-ul nu se întâmplă imediat (deși redirect-ul va schimba pagina)
      
    } catch (err) {
      console.error(err);
      setLoading(null);
      alert("A apărut o eroare neașteptată.");
    }
  };

  return (
    <>
      <Head>
        <title>Planuri și Prețuri | Randări 3D AI</title>
        <meta
          name="description"
          content="Alege pachetul de credite potrivit pentru proiectele tale de randare 3D. Prețuri flexibile pentru orice nevoie."
        />
      </Head>

      <main className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8 overflow-hidden relative">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Alege planul potrivit pentru{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                viziunea ta
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Investește în calitate și viteză. Deblochează puterea inteligenței
              artificiale pentru proiectele tale de design și arhitectură.
            </p>
          </div>

          <div className="grid gap-8 lg:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start">
            {plans.map((plan) => (
              <div
                key={plan.slug}
                className={`relative group flex flex-col h-full bg-card border rounded-2xl transition-all duration-300 ${
                  plan.recommended
                    ? "border-primary shadow-2xl scale-100 lg:scale-105 z-20 shadow-primary/20"
                    : "border-border hover:border-primary/50 hover:shadow-xl shadow-lg"
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm px-4 py-1 rounded-full font-bold uppercase tracking-wider shadow-lg flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Recomandat
                  </div>
                )}

                <div className="p-8 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      {plan.name}
                    </h2>
                    {plan.recommended ? (
                      <Zap className="w-6 h-6 text-primary" />
                    ) : (
                      <div className="w-6 h-6" />
                    )}
                  </div>

                  <p className="text-muted-foreground text-sm mb-6 min-h-[40px]">
                    {plan.description}
                  </p>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-foreground">
                        {plan.price}
                      </span>
                      <span className="text-xl font-medium text-muted-foreground">
                        lei
                      </span>
                    </div>
                    <p className="text-sm font-medium text-primary mt-1">
                      {plan.points} credite incluse
                    </p>
                  </div>

                  <hr className="border-border mb-8" />

                  <ul className="space-y-4 mb-8">
                    {plan.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          {benefit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 pt-0 mt-auto">
                  <button
                    onClick={() => handleStripeBuy(plan)}
                    disabled={loading === plan.slug}
                    className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 transform active:scale-95 ${
                      plan.recommended
                        ? "bg-gradient-to-r from-primary to-purple-600 text-white hover:shadow-lg hover:shadow-primary/25"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {loading === plan.slug ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Se procesează...
                      </span>
                    ) : (
                      "Alege Planul"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-muted-foreground">
              Ai nevoie de un plan personalizat pentru compania ta?{" "}
              <Link
                href="/contact"
                className="text-primary font-medium hover:underline underline-offset-4"
              >
                Contactează-ne
              </Link>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}