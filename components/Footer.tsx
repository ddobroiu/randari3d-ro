import Link from "next/link";
import { FaGlobeEurope } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border pt-8 pb-4 mt-16 transition-colors text-sm">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Am simplificat structura într-un singur container principal */}
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          
          {/* Partea stângă: Brand & drepturi, acum centrată pe mobil */}
          <div className="flex items-center gap-2 text-muted-foreground text-center md:text-left">
            <span className="text-xl text-primary">
              <FaGlobeEurope />
            </span>
            <span>
              © {new Date().getFullYear()}{" "}
              <span className="font-semibold text-foreground">Randări 3D AI</span>.
            </span>
            <span className="hidden md:inline">Toate drepturile rezervate.</span>
          </div>

          {/* Partea dreaptă: Link-uri, acum mai compacte pe mobil */}
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-center">
            <Link href="/termeni" className="hover:text-primary transition-colors">
              Termeni și condiții
            </Link>
            <Link href="/confidentialitate" className="hover:text-primary transition-colors">
              Confidențialitate
            </Link>
          </nav>
        </div>

        {/* Linia de jos: Credit & data */}
        <div className="mt-8 pt-4 border-t border-border/50 flex flex-col items-center gap-2 md:flex-row md:justify-between text-xs text-muted-foreground">
          <p>
            Ultima actualizare: {new Date().toLocaleDateString("ro-RO", { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <p>
            Realizat cu ♥ de&nbsp;
            <a
              href="https://e-web.ro/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary transition-colors font-medium"
            >
              e-web.ro
            </a>
          </p>
        </div>

      </div>
    </footer>
  );
}