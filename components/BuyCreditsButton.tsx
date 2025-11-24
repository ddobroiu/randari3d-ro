import { loadStripe } from "@stripe/stripe-js";
import { useSession } from "next-auth/react";
import { useState } from "react";
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function BuyCreditsButton({ priceId, quantity = 1 }) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    const res = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        priceId,
        quantity,
        email: session?.user?.email,
      }),
    });
    const { sessionId, error } = await res.json();
    setLoading(false);
    if (error) {
      alert(error);
      return;
    }
    const stripe = await stripePromise;
    await stripe?.redirectToCheckout({ sessionId });
  };

  return (
    <button onClick={handleBuy} disabled={loading}>
      {loading ? "Se procesează..." : "Cumpără cu Stripe"}
    </button>
  );
}