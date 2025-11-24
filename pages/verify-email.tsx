import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { token, email } = router.query;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token || !email) return;

    const verifyEmail = async () => {
      try {
        const res = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email }),
        });

        setStatus(res.ok ? "success" : "error");
      } catch (error) {
        console.error("Eroare verificare email:", error);
        setStatus("error");
      }
    };

    verifyEmail();
  }, [token, email]);

  return (
    <>
      <Head>
        <title>Verificare email | Randări 3D AI</title>
        <meta name="description" content="Confirmă adresa de email pentru contul tău Randări 3D AI. Accesează platforma după verificare." />
        <meta property="og:title" content="Verificare email | Randări 3D AI" />
        <meta property="og:description" content="Confirmă adresa de email pentru contul tău Randări 3D AI." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/verify-email" />
        <link rel="canonical" href="https://randari3d.ro/verify-email" />
      </Head>

      <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 transition-colors">
        <div className="max-w-md w-full bg-card text-card-foreground border border-border p-8 rounded-2xl shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-semibold">Verificare email</h1>

          {status === "loading" && (
            <p className="text-muted-foreground animate-pulse">
              Se verifică adresa de email...
            </p>
          )}

          {status === "success" && (
            <p className="text-green-500 font-medium">
              ✅ Email verificat cu succes! Acum poți <a href="/login" className="text-primary underline">intra în cont</a>.
            </p>
          )}

          {status === "error" && (
            <p className="text-red-500">
              ❌ A apărut o eroare. Verifică dacă linkul din email este valid sau nu a fost deja folosit.
            </p>
          )}
        </div>
      </main>
    </>
  );
}

// Pentru a forța Next.js să nu o trateze ca pagină statică
export async function getServerSideProps() {
  return { props: {} };
}