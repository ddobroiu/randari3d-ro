import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

// Am lăsat DOAR stilurile tale globale.
import "@/styles/globals.css";

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Setează limba HTML în funcție de localizarea routerului
    const { locale } = router;
    if (locale) {
      document.documentElement.lang = locale;
    }

    // Aplică tema salvată din localStorage
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // Aplică clase de bază pe body și stil flex
    document.body.classList.add(
      "font-sans",
      "antialiased",
      "bg-background",
      "text-foreground"
    );
    document.body.style.minHeight = "100vh";
    document.body.style.display = "flex";
    document.body.style.flexDirection = "column";
  }, [router]);

  return (
    <SessionProvider session={session}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SessionProvider>
  );
}
