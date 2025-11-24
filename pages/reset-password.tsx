"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (!password || !confirm) {
      setMessage("Toate câmpurile sunt necesare.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setMessage("Parolele nu se potrivesc.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("✅ Parola a fost resetată. Vei fi redirecționat...");
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setMessage(data.error || "Eroare la resetare.");
      }
    } catch {
      setMessage("Eroare de rețea.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Resetare parolă | Randări 3D AI</title>
        <meta name="description" content="Resetează parola contului tău Randări 3D AI rapid și sigur. Introdu parola nouă și confirmarea pentru a finaliza procesul." />
        <meta property="og:title" content="Resetare parolă | Randări 3D AI" />
        <meta property="og:description" content="Resetează parola contului tău Randări 3D AI rapid și sigur." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/reset-password" />
        <link rel="canonical" href="https://randari3d.ro/reset-password" />
      </Head>

      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card text-card-foreground border border-border p-8 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-2xl font-semibold text-center">Resetare parolă</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              placeholder="Parolă nouă"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
              required
            />
            <input
              type="password"
              placeholder="Confirmă parola"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              {loading ? "Se trimite..." : "Resetează parola"}
            </button>
          </form>

          {message && (
            <p className="text-sm text-center mt-4 text-muted-foreground">
              {message}
            </p>
          )}
        </div>
      </main>
    </>
  );
}