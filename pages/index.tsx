import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";

// Import Panorama fără SSR
const Panorama = dynamic(() => import("@/components/Panorama"), { ssr: false });

function SimpleTabSwitcher({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "image", label: "Imagine" },
    { id: "video", label: "Video" },
    { id: "3d", label: "3D" },
  ];
  return (
    <div className="flex space-x-4 border-b border-border mb-8">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`py-3 px-4 text-base font-semibold transition-colors border-b-2
            ${activeTab === tab.id
              ? "text-black border-primary bg-white"
              : "text-muted-foreground border-transparent hover:text-primary/90"}
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function AutoImageSwitcher({ before, after }) {
  const [showAfter, setShowAfter] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setShowAfter((p) => !p), 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full h-56 overflow-hidden rounded-xl border border-border relative">
      <img
        src={showAfter ? after : before}
        alt="Comparație AI"
        className="w-full h-full object-cover transition-opacity duration-500"
      />
    </div>
  );
}

type HomeHistoryItem = {
  type: string;
  imageUrl: string;
  prompt: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [credits, setCredits] = useState(0);
  const [history, setHistory] = useState<HomeHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("image");

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/user-credits")
        .then((res) => res.json())
        .then((data) => setCredits(data.credits || 0));
      fetch("/api/history-latest")
        .then((res) => res.json())
        .then((data) => setHistory(data.results || []));
    }
  }, [session]);

  const robots = [
    { title: "Imagine + Prompt ➜ Imagine", desc: "Generează o nouă versiune AI din imagine + prompt.", link: "/robots/image-image", type: "image", before: "/Imagine+Prompt-Imagine-inainte.jpg", after: "/Imagine+Prompt-Imagine-dupa.jpg" },
    { title: "Imagine ➜ Eliminare Obiecte", desc: "Elimină obiecte din imagine.", link: "/robots/image-remove", type: "image", before: "/Imagine-Eliminare-inainte.jpg", after: "/Imagine-Eliminare-dupa.jpg" },
    { title: "Imagine ➜ Decorare Cameră", desc: "Aplică stiluri de design AI.", link: "/robots/image-decor", type: "image", before: "/Imagine-Decorare-Cameră-inainte.jpg", after: "/Imagine-Decorare-Cameră-dupa.jpg" },
    { title: "Text ➜ Imagine", desc: "Generează o imagine dintr-o descriere.", link: "/robots/image-text", type: "image", before: "/Imagine+Prompt-inainte.jpg", after: "/Imagine+Prompt-dupa.jpg" },
    { title: "Imagine ➜ Modificare Textură", desc: "Aplică o textură nouă AI.", link: "/robots/image-texture", type: "image", before: "/Imagine-Textura-inainte.jpg", after: "/Imagine-Textura-dupa.jpg" },
    { title: "Imagine ➜ Remove Background", desc: "Elimină fundalul unei imagini.", link: "/robots/image-remove-bg", type: "image", before: "/Imagine-removebg-inainte.jpg", after: "/Imagine-removebg-dupa.jpg" },
    { title: "Imagine ➜ Video", desc: "Transformă imagine într-un video AI.", link: "/robots/video-image", type: "video", before: "/Imagine-Video-inainte.jpg", video: "/imagine-video-dupa.mp4" },
    { title: "Text ➜ Video", desc: "Generează un video din text.", link: "/robots/video-text", type: "video" },
    { title: "Imagine ➜ Vedere 3D", desc: "Randare 3D interactivă.", link: "/robots/3d-image", type: "3d", before: "/Imagine-Vedere3D-inainte.jpg", video: "/Imagine-Vedere3D-dupa.mp4" },
  ];

  const filteredRobots = robots.filter((r) => r.type === activeTab);

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-6 font-sans overflow-x-hidden transition-colors duration-300">
      <Head>
        <title>Randări 3D AI – Generare imagini, video și 3D cu inteligență artificială</title>
        <meta name="description" content="Platformă AI pentru generarea de imagini, video și randări 3D. Automatizează designul, eliminarea obiectelor, texturarea, decorarea și multe altele!" />
      </Head>

      {/* PANORAMĂ SUS */}
      <Panorama image="/panorama.jpg" />

      {/* TAB MODERN SIMPLU */}
      <div className="flex justify-center mb-12">
        <SimpleTabSwitcher activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* GRID ROBOTI */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {filteredRobots.map((robot, i) => (
          <div key={i} className="card-neumorph p-5 space-y-3 text-card-foreground">
            {robot.type === "image" && robot.before && robot.after ? (
              <AutoImageSwitcher before={robot.before} after={robot.after} />
            ) : robot.video ? (
              <video src={robot.video} controls className="w-full h-56 object-cover rounded-lg" />
            ) : (
              <div className="w-full h-56 flex items-center justify-center bg-muted text-muted-foreground text-sm rounded-xl">
                Previzualizare indisponibilă
              </div>
            )}
            <h3 className="text-lg font-semibold">{robot.title}</h3>
            <p className="text-sm text-muted-foreground">{robot.desc}</p>
            <Link href={robot.link} className="inline-block mt-1 bg-primary text-white px-4 py-2 rounded-md hover:opacity-90 transition text-sm">
              Deschide robotul
            </Link>
          </div>
        ))}
      </section>

      {/* ISTORIC */}
      {history.length > 0 && (
        <section className="max-w-6xl mx-auto mt-16">
          <h2 className="text-2xl font-semibold mb-4">Ultimele generări</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {history.map((item, index) => (
              <div key={index} className="card-neumorph p-4 space-y-2 text-card-foreground">
                {item.type === "image" ? (
                  <img src={item.imageUrl} alt="Randare" className="rounded-lg w-full h-48 object-cover" />
                ) : (
                  <video src={item.imageUrl} controls className="rounded-lg w-full h-48 object-cover" />
                )}
                <p className="text-xs text-muted-foreground truncate">Prompt: {item.prompt}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}