import React from "react";
import Head from "next/head";

export default function ConfidentialitatePage() {
  return (
    <>
      <Head>
        <title>Politica de Confidențialitate | Randări 3D AI</title>
        <meta name="description" content="Află cum colectăm, folosim și protejăm datele personale pe platforma Randări 3D AI. Vezi ce drepturi ai și cum poți solicita acces sau ștergerea datelor." />
        {/* SEO TAGS */}
        <meta property="og:title" content="Politica de Confidențialitate | Randări 3D AI" />
        <meta property="og:description" content="Află cum colectăm, folosim și protejăm datele personale pe platforma Randări 3D AI. Vezi ce drepturi ai și cum poți solicita acces sau ștergerea datelor." />
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://randari3d.ro/confidentialitate" />
        <meta property="og:image" content="https://randari3d.ro/og-image-confidentialitate.jpg" />
        <meta name="twitter:title" content="Politica de Confidențialitate | Randări 3D AI" />
        <meta name="twitter:description" content="Află cum colectăm, folosim și protejăm datele personale pe platforma Randări 3D AI. Vezi ce drepturi ai și cum poți solicita acces sau ștergerea datelor." />
        <meta name="twitter:image" content="https://randari3d.ro/og-image-confidentialitate.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/confidentialitate" />
      </Head>
      <main className="min-h-screen bg-background text-foreground px-6 py-12 transition-colors">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-10 text-center">Politica de Confidențialitate</h1>

        <div className="max-w-4xl mx-auto bg-card p-8 rounded-2xl shadow-xl space-y-8">
          {/* 1. Introducere */}
          <section>
            <h2 className="text-2xl font-bold mb-2">1. Introducere</h2>
            <p>
              Această pagină explică modul în care colectăm, folosim și protejăm datele personale ale utilizatorilor platformei <strong>Randări 3D AI</strong>. Prin utilizarea serviciului, ești de acord cu această politică.
            </p>
          </section>

          {/* 2. Ce date sunt colectate */}
          <section>
            <h2 className="text-2xl font-bold mb-2">2. Date colectate</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Email și nume pentru autentificare și identificare</li>
              <li>Date tehnice (IP, browser, sistem de operare) pentru securitate și analiză internă</li>
              <li>Conținut generat: prompturi, imagini, video, statistici de utilizare</li>
              <li>Date privind afilierea (utilizatori invitați, recompense)</li>
              <li>Feedback și mesaje trimise prin chat sau formulare</li>
            </ul>
          </section>

          {/* 3. Cum folosim datele */}
          <section>
            <h2 className="text-2xl font-bold mb-2">3. Scopul utilizării datelor</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Autentificare și acces la cont</li>
              <li>Generare imagini/video AI și salvare istoric</li>
              <li>Gestionarea planurilor, creditelor și plăților</li>
              <li>Analiză internă pentru îmbunătățirea serviciului</li>
              <li>Prevenirea abuzurilor și securitatea platformei</li>
              <li>Notificări privind modificări de termeni, planuri sau funcționalitate</li>
            </ul>
          </section>

          {/* 4. Securitatea datelor */}
          <section>
            <h2 className="text-2xl font-bold mb-2">4. Securitatea datelor</h2>
            <p>
              Luăm măsuri tehnice și organizaționale pentru a proteja datele tale. Accesul la date este restricționat doar personalului autorizat. Nu partajăm informații cu terți fără consimțământul tău.
            </p>
          </section>

          {/* 5. Drepturile utilizatorului */}
          <section>
            <h2 className="text-2xl font-bold mb-2">5. Drepturile tale</h2>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Soliciți acces la datele tale</li>
              <li>Soliciți corectarea sau ștergerea acestora</li>
              <li>Îți retragi consimțământul oricând pentru prelucrarea datelor</li>
            </ul>
            <p>
              Pentru exercitarea acestor drepturi, contactează-ne la <a href="mailto:support@randari3d.ro" className="underline text-primary">support@randari3d.ro</a>.
            </p>
          </section>

          {/* 6. Modificări ale politicii */}
          <section>
            <h2 className="text-2xl font-bold mb-2">6. Modificări ale politicii</h2>
            <p>
              Putem modifica această politică de confidențialitate oricând. Orice modificare va fi comunicată prin email sau notificare în aplicație.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}