import { useState } from "react";
import Head from "next/head";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      setMessage(data.message || data.error || "Eroare necunoscută.");
    } catch (err) {
      setMessage("A apărut o eroare la trimiterea cererii.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Resetare parolă | Randări 3D AI</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground transition-colors">
        <div className="w-full max-w-md bg-card text-card-foreground border border-border p-8 rounded-2xl shadow-xl space-y-6">
          <h1 className="text-2xl font-semibold text-center">Resetare parolă</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              {loading ? "Se trimite..." : "Trimite link de resetare"}
            </button>
          </form>

          {message && (
            <p className="text-sm text-center mt-4 text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
