import Header from "./Header";
import Footer from "./Footer";

// Definirea tipului pentru "props", unde `children` poate fi orice element React valid.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // Aici definim structura cu clase Tailwind CSS:
    // Containerul principal va avea culoarea de fundal și textul definite în `tailwind.config.js`.
    // Fontul va fi cel standard "sans-serif", iar tranziția culorilor va fi animată.
    //
    // Pe ecrane medii (md:) și mai mari, layout-ul va fi o coloană flexibilă (flex-col)
    // care ocupă cel puțin toată înălțimea ecranului (min-h-screen).
    // Pe mobil, aceste clase `md:` nu se aplică, deci va fi un flux normal.
    <div className="bg-background text-foreground font-sans transition-colors md:flex md:flex-col md:min-h-screen">
      <Header />

      {/* Elementul <main> conține paginile aplicației.
        - 'w-full': Ocupă toată lățimea disponibilă.
        - 'max-w-7xl': Lățimea maximă este limitată pentru a menține lizibilitatea pe ecrane mari.
        - 'mx-auto': Centrează containerul pe orizontală.
        - 'px-4 sm:px-6': Adaugă spațiu interior pe orizontală (padding), mai mare pe ecrane mici (sm:) în sus.
        - 'py-8': Adaugă spațiu interior pe verticală (sus și jos).
        - 'md:flex-grow': Pe desktop, acest element "crește" pentru a ocupa tot spațiul vertical 
          rămas liber, împingând astfel footer-ul în partea de jos a ecranului.
      */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 md:flex-grow">
        {children}
      </main>

      <Footer />
    </div>
  );
}
