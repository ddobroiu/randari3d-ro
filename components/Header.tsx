"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchCredits() {
      if (session?.user?.email) {
        const res = await fetch("/api/user-credits");
        const data = await res.json();
        setCredits(data.credits);
      }
    }
    fetchCredits();
  }, [session]);

  return (
    <>
      {/* Aici este modificarea: am schimbat `sticky` în `md:sticky` */}
      <header className="bg-light-background/80 dark:bg-background/80 backdrop-blur-md text-light-card-foreground dark:text-white md:sticky top-0 z-50 border-b border-light-border dark:border-border shadow transition-colors h-16 flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center" aria-label="Pagina principală">
              <img
                src="/logo.png"
                alt="Randări 3D AI"
                className="logo-img transition-transform duration-300 hover:scale-105"
              />
            </Link>
            {session?.user && credits !== null && (
              <span className="text-sm font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-md hidden md:inline">
                {credits} puncte
              </span>
            )}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <nav className="flex gap-6 text-sm font-medium tracking-wide">
              <NavLink href="/">Acasă</NavLink>
              {session?.user && (
                <>
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/planuri">Planuri</NavLink>
                </>
              )}
              <NavLink href="/portofoliu">Portofoliu</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </nav>

            <Link
              href="/chat"
              className="border border-light-border dark:border-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-light-muted dark:hover:bg-white hover:text-black transition"
            >
              Chat AI
            </Link>

            <Link
              href="/recomandare"
              className="border border-light-border dark:border-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-light-muted dark:hover:bg-white hover:text-black transition"
            >
              Recomandări
            </Link>

            <ThemeToggle />

            {session?.user ? (
              <button
                onClick={() => signOut()}
                className="text-xs hover:text-red-500 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs px-3 py-1 rounded-md border border-light-border dark:border-white hover:bg-light-muted dark:hover:bg-white hover:text-black transition"
                >
                  Autentificare
                </Link>
                <Link
                  href="/register"
                  className="text-xs px-3 py-1 rounded-md border border-light-border dark:border-white hover:bg-light-muted dark:hover:bg-white hover:text-black transition"
                >
                  Creează cont
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
            {session?.user && credits !== null && (
              <span className="text-xs font-semibold text-green-600 bg-green-100 dark:bg-green-900 px-2 py-1 rounded-md">
                {credits} puncte
              </span>
            )}
            <ThemeToggle />
            <button onClick={() => setMenuOpen(true)} aria-label="Meniu">
              <Menu size={26} />
            </button>
          </div>
        </div>
      </header>

      {/* Meniu lateral animat + overlay */}
      <div
        className={`fixed top-0 left-0 h-full w-[280px] bg-light-background/90 dark:bg-background/90 backdrop-blur-md text-light-card-foreground dark:text-white border-r border-light-border dark:border-border shadow-md z-50 menu-drawer ${
          menuOpen ? "open" : "closed"
        }`}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-light-border dark:border-border">
          <img src="/logo.png" alt="Randări 3D AI" className="logo-img" />
          <button onClick={() => setMenuOpen(false)} aria-label="Închide meniu">
            <X size={24} />
          </button>
        </div>

        <nav className="flex flex-col gap-5 px-6 pt-6 text-sm">
          <NavLink href="/" onClick={() => setMenuOpen(false)}>
            Acasă
          </NavLink>
          {session?.user && (
            <>
              <NavLink href="/dashboard" onClick={() => setMenuOpen(false)}>
                Dashboard
              </NavLink>
              <NavLink href="/planuri" onClick={() => setMenuOpen(false)}>
                Planuri
              </NavLink>
            </>
          )}
          <NavLink href="/portofoliu" onClick={() => setMenuOpen(false)}>
            Portofoliu
          </NavLink>
          <NavLink href="/contact" onClick={() => setMenuOpen(false)}>
            Contact
          </NavLink>
        </nav>

        <div className="px-6 space-y-4 mt-6">
          <Link
            href="/chat"
            onClick={() => setMenuOpen(false)}
            className="block border border-border text-center text-sm py-2 rounded-md hover:bg-muted transition"
          >
            Chat AI
          </Link>
          <Link
            href="/recomandare"
            onClick={() => setMenuOpen(false)}
            className="block border border-border text-center text-sm py-2 rounded-md hover:bg-muted transition"
          >
            Recomandări
          </Link>
          {session?.user ? (
            <button
              onClick={() => {
                signOut();
                setMenuOpen(false);
              }}
              className="w-full text-left text-sm text-red-500"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="block border border-border text-sm text-center py-2 rounded-md hover:bg-muted transition"
              >
                Autentificare
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="block border border-border text-sm text-center py-2 rounded-md hover:bg-muted transition"
              >
                Creează cont
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 menu-overlay ${
          menuOpen ? "open" : "closed"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      {/* Animatii */}
      <style jsx global>{`
        .menu-drawer {
          transition: transform 0.35s cubic-bezier(0.45, 0.03, 0.51, 0.95),
            opacity 0.3s;
          transform: translateX(-100%);
          opacity: 0;
          pointer-events: none;
        }
        .menu-drawer.open {
          transform: translateX(0);
          opacity: 1;
          pointer-events: auto;
        }
        .menu-overlay {
          transition: opacity 0.3s;
          opacity: 0;
          pointer-events: none;
        }
        .menu-overlay.open {
          opacity: 1;
          pointer-events: auto;
        }
      `}</style>
    </>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative group hover:text-blue-500 transition"
    >
      {children}
      <span className="block h-[2px] w-0 group-hover:w-full bg-blue-400 transition-all duration-300 absolute bottom-[-4px] left-0"></span>
    </Link>
  );
}