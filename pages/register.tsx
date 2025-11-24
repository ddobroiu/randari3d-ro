import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import Head from "next/head";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 🔗 Referral logic
  const router = useRouter();
  const [referral, setReferral] = useState<string | null>(null);

  useEffect(() => {
    // Ia codul din URL dacă există (?ref=xyz)
    if (router.isReady) {
      const ref = (router.query.ref as string) || null;
      setReferral(ref);
    }
  }, [router.isReady, router.query.ref]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ref: referral, // 🚩 Trimite referral la backend!
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "A apărut o eroare neașteptată.");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Nu s-a putut conecta la server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Înregistrare cont | Randări 3D AI</title>
        <meta name="description" content="Creează un cont nou pe Randări 3D AI pentru a genera imagini și video cu ajutorul inteligenței artificiale. Beneficiază de sistem de afiliere și funcționalități premium." />
        <meta property="og:title" content="Înregistrare cont | Randări 3D AI" />
        <meta property="og:description" content="Creează un cont nou pe Randări 3D AI pentru a genera imagini și video cu ajutorul inteligenței artificiale." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/register" />
        <link rel="canonical" href="https://randari3d.ro/register" />
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground px-4 transition-colors">
        <div className="bg-card text-card-foreground border border-border p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="flex items-center justify-center gap-2">
            <UserPlus className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-semibold">Creează un cont</h1>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-100 dark:bg-red-900/20 p-2 rounded-lg text-center mt-4">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 bg-green-100 dark:bg-green-900/20 p-2 rounded-lg text-center mt-4">
              Cont creat! Verifică emailul pentru activare.
            </p>
          )}

          {!success && (
            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
              <input
                type="text"
                name="name"
                placeholder="Nume complet"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Parolă"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-primary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white p-3 rounded-lg font-medium hover:opacity-90 transition"
              >
                {loading ? "Se înregistrează..." : "Creează cont"}
              </button>
            </form>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Ai deja cont?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Autentifică-te aici
            </Link>
          </p>
          {/* 🏷️ Opțional, arată și ce cod de afiliere ai */}
          {referral && (
            <div className="text-xs text-muted-foreground mt-4 text-center">
              <span className="bg-muted px-2 py-1 rounded">
                Ai fost invitat de: <span className="font-semibold">{referral}</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}