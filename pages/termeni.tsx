import React from "react";
import Head from "next/head";

export default function TermeniPage() {
  return (
    <>
      <Head>
        <title>Termeni și Condiții | Randări 3D AI</title>
        <meta name="description" content="Citește termenii și condițiile platformei Randări 3D AI: confidențialitate, reguli, plăți, proprietate intelectuală, răspundere și suport." />
        {/* SEO TAGS */}
        <meta property="og:title" content="Termeni și Condiții | Randări 3D AI" />
        <meta property="og:description" content="Află detalii despre utilizarea platformei Randări 3D AI: reguli, plăți, drepturi, suport și confidențialitate." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://randari3d.ro/termeni" />
        <meta property="og:image" content="https://randari3d.ro/og-image-termeni.jpg" />
        <meta name="twitter:title" content="Termeni și Condiții | Randări 3D AI" />
        <meta name="twitter:description" content="Află detalii despre utilizarea platformei Randări 3D AI: reguli, plăți, drepturi, suport și confidențialitate." />
        <meta name="twitter:image" content="https://randari3d.ro/og-image-termeni.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/termeni" />
      </Head>
      <main className="min-h-screen bg-background text-foreground px-6 py-12 transition-colors">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center">Termeni și Condiții</h1>

        <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-xl space-y-8">
          {/* 1. Acceptare și modificare termeni */}
          <section>
            <h2 className="text-2xl font-bold mb-2">1. Acceptarea termenilor</h2>
            <p>
              Prin utilizarea platformei <strong>Randări 3D AI</strong>, accepți acești termeni și condiții. Dacă nu ești de acord, te rugăm să nu folosești serviciile oferite.
            </p>
            <p>
              Ne rezervăm dreptul de a modifica acești termeni oricând. Te vom informa prin email sau notificări în aplicație în cazul unor modificări semnificative.
            </p>
          </section>

          {/* 2. Politica de confidențialitate și date personale */}
          <section>
            <h2 className="text-2xl font-bold mb-2">2. Confidențialitate și protecția datelor</h2>
            <p>
              Colectăm date personale precum email, nume, date tehnice (browser/IP) și conținutul generat (prompturi, imagini/video). Datele sunt folosite pentru autentificare, generare AI, și îmbunătățirea serviciului. Nu partajăm datele cu terți fără consimțământul tău. Poți solicita acces, corectare sau ștergere oricând.
            </p>
            <p>
              Luăm măsuri tehnice și organizaționale pentru securitate. Vezi <a href="/confidentialitate" className="underline text-primary">Politica de confidențialitate</a> pentru detalii.
            </p>
          </section>

          {/* 3. Utilizare platformă și reguli */}
          <section>
            <h2 className="text-2xl font-bold mb-2">3. Utilizarea platformei și reguli</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Utilizatorii pot genera imagini/video AI folosind credite, conform planului ales.</li>
              <li>Este interzisă generarea de conținut ilegal, ofensator sau care încalcă drepturi de autor.</li>
              <li>Abuzul, spamul sau utilizarea necorespunzătoare a platformei pot duce la suspendarea contului.</li>
              <li>Roboții specializați pot fi folosiți în limita creditelor disponibile.</li>
              <li>Portofoliul generat poate fi vizualizat și distribuit respectând drepturile platformei.</li>
            </ul>
          </section>

          {/* 4. Planuri, credite și plăți */}
          <section>
            <h2 className="text-2xl font-bold mb-2">4. Planuri, credite și plăți</h2>
            <p>
              Platforma oferă planuri cu un număr de credite și beneficii specifice. Plățile se pot realiza online, iar creditele sunt utilizate pentru generări AI. Pentru detalii accesează <a href="/planuri" className="underline text-primary">pagina de planuri</a>.
            </p>
          </section>

          {/* 5. Afiliere și recompense */}
          <section>
            <h2 className="text-2xl font-bold mb-2">5. Afiliere și recompense</h2>
            <p>
              Poți invita alți utilizatori și primi recompense conform sistemului de afiliere. Numărul și lista utilizatorilor aduși sunt vizibile în dashboard.
            </p>
          </section>

          {/* 6. Proprietate intelectuală */}
          <section>
            <h2 className="text-2xl font-bold mb-2">6. Proprietate intelectuală</h2>
            <p>
              Output-ul AI (imagini/video generate) poate fi folosit de utilizator, dar platforma își rezervă dreptul de utilizare, promovare și ștergere a conținutului generat dacă acesta încalcă regulile.
            </p>
          </section>

          {/* 7. Limitări și răspundere */}
          <section>
            <h2 className="text-2xl font-bold mb-2">7. Limitări și răspundere</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Nu garantăm funcționarea neîntreruptă sau fără erori a serviciului.</li>
              <li>Platforma nu este responsabilă pentru conținutul generat de AI sau utilizarea acestuia.</li>
              <li>Utilizatorul este responsabil de rezultatele obținute și de respectarea legislației.</li>
            </ul>
          </section>

          {/* 8. Drepturile utilizatorului */}
          <section>
            <h2 className="text-2xl font-bold mb-2">8. Drepturile utilizatorului</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Poți solicita acces la datele tale personale.</li>
              <li>Poți solicita corectarea sau ștergerea datelor.</li>
              <li>Îți poți retrage consimțământul oricând pentru prelucrarea datelor.</li>
            </ul>
          </section>

          {/* 9. Contact și suport */}
          <section>
            <h2 className="text-2xl font-bold mb-2">9. Contact și suport</h2>
            <p>
              Pentru întrebări sau suport, te rugăm să ne contactezi la <a href="mailto:support@randari3d.ro" className="underline text-primary">support@randari3d.ro</a>.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}