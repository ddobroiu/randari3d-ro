import { useState, useEffect } from "react";
import Head from "next/head"; // SEO import

const robots = [
  {
    title: "Imagine + Prompt ➜ Imagine",
    desc: "Generează o nouă versiune AI din imagine + prompt.",
    type: "image",
    before: "/Imagine+Prompt-Imagine-inainte.jpg",
    after: "/Imagine+Prompt-Imagine-dupa.jpg",
  },
  {
    title: "Imagine ➜ Eliminare Obiecte",
    desc: "Elimină obiecte din imagine.",
    type: "image",
    before: "/Imagine-Eliminare-inainte.jpg",
    after: "/Imagine-Eliminare-dupa.jpg",
  },
  {
    title: "Imagine ➜ Decorare Cameră",
    desc: "Aplică stiluri de design AI.",
    type: "image",
    before: "/Imagine-Decorare-Cameră-inainte.jpg",
    after: "/Imagine-Decorare-Cameră-dupa.jpg",
  },
  {
    title: "Text ➜ Imagine",
    desc: "Generează o imagine dintr-o descriere.",
    type: "image",
    before: "/Imagine+Prompt-inainte.jpg",
    after: "/Imagine+Prompt-dupa.jpg",
  },
  {
    title: "Imagine ➜ Modificare Textură",
    desc: "Aplică o textură nouă AI.",
    type: "image",
    before: "/Imagine-Textura-inainte.jpg",
    after: "/Imagine-Textura-dupa.jpg",
  },
  {
    title: "Imagine ➜ Remove Background",
    desc: "Elimină fundalul unei imagini.",
    type: "image",
    before: "/Imagine-removebg-inainte.jpg",
    after: "/Imagine-removebg-dupa.jpg",
  },
  // VIDEO
  {
    title: "Imagine ➜ Video",
    desc: "Transformă imagine într-un video AI.",
    type: "video",
    before: "/Imagine-Video-inainte.jpg",
    after: "/imagine-video-dupa.mp4",
  },
  {
    title: "Text ➜ Video",
    desc: "Generează un video din text.",
    type: "video",
    before: "/Imagine+Prompt-inainte.jpg",
    after: "/imagine-video-dupa.mp4",
  },
  // 3D
  {
    title: "Imagine ➜ Vedere 3D",
    desc: "Randare 3D interactivă.",
    type: "3d",
    before: "/Imagine-Vedere3D-inainte.jpg",
    after: "/Imagine-Vedere3D-dupa.mp4",
  },
];

const tabNames: Record<string, string> = {
  image: "🖼️ Imagine",
  video: "🎬 Video",
  "3d": "🌀 3D",
};

export default function PortofoliuPage() {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "3d">("image");

  const filtered = robots.filter((r) => r.type === activeTab);

  return (
    <>
      <Head>
        <title>Portofoliu AI – Înainte & După | Randări 3D</title>
        <meta name="description" content="Descoperă portofoliul AI: vezi transformări înainte și după pentru imagini, video și 3D generate cu roboții Randari3D." />
        {/* SEO TAGS */}
        <meta property="og:title" content="Portofoliu AI – Înainte & După | Randări 3D" />
        <meta property="og:description" content="Descoperă portofoliul AI: vezi transformări înainte și după pentru imagini, video și 3D generate cu roboții Randari3D." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/portofoliu" />
        <meta property="og:image" content="https://randari3d.ro/og-image-portofoliu.jpg" />
        <meta name="twitter:title" content="Portofoliu AI – Înainte & După | Randări 3D" />
        <meta name="twitter:description" content="Descoperă portofoliul AI: vezi transformări înainte și după pentru imagini, video și 3D generate cu roboții Randari3D." />
        <meta name="twitter:image" content="https://randari3d.ro/og-image-portofoliu.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/portofoliu" />
      </Head>
      <main className="min-h-screen bg-background text-foreground px-4 py-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Portofoliu AI – Înainte & După</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Descoperă transformările AI: vezi rapid rezultatul „înainte” și „după” cu fiecare robot!
          </p>
        </div>

        {/* Taburi */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full bg-muted/40 p-1 shadow-inner border border-border">
            {(["image", "video", "3d"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 text-sm font-semibold transition-all rounded-full relative
                  ${activeTab === tab 
                    ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"}`}
              >
                {tabNames[tab]}
                {activeTab === tab && (
                  <span className="absolute inset-0 rounded-full ring-2 ring-primary/50 animate-pulse pointer-events-none"></span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-10 max-w-4xl mx-auto">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl shadow hover:shadow-xl transition p-0 flex flex-col"
            >
              <div className="p-6 pb-0">
                <h2 className="text-xl font-bold text-center mb-1">{item.title}</h2>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
              </div>
              {/* Content: 2 columns - glisator */}
              <div className="grid grid-cols-2 gap-0 border-t border-border mt-5">
                <div className="relative flex flex-col items-center">
                  <div className="text-xs font-medium mb-1 mt-3 text-center">Înainte</div>
                  {item.type === "image" ? (
                    <img
                      src={item.before}
                      alt={`Înainte - ${item.title}`}
                      className="w-full h-56 object-cover rounded-bl-2xl"
                    />
                  ) : item.type === "video" || item.type === "3d" ? (
                    <img
                      src={item.before}
                      alt={`Înainte - ${item.title}`}
                      className="w-full h-56 object-cover rounded-bl-2xl"
                    />
                  ) : null}
                </div>
                <div className="relative flex flex-col items-center">
                  <div className="text-xs font-medium mb-1 mt-3 text-center">După</div>
                  {/* Glisator: imagine, video sau 3d */}
                  {item.type === "image" ? (
                    <AutoImageSwitcher before={item.before!} after={item.after!} />
                  ) : item.type === "video" || item.type === "3d" ? (
                    <AutoVideoSwitcher poster={item.before!} src={item.after!} />
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}

// GLISATOR IMAGINE – automat
function AutoImageSwitcher({ before, after }: { before: string; after: string }) {
  const [showAfter, setShowAfter] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setShowAfter((prev) => !prev), 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full h-56 overflow-hidden rounded-br-2xl border-l border-border relative transition-all">
      <img
        src={showAfter ? after : before}
        alt="Comparație AI"
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-background/80 shadow">
        {showAfter ? "După" : "Înainte"}
      </div>
    </div>
  );
}

// GLISATOR VIDEO – automat (afișează video sau poster)
function AutoVideoSwitcher({ poster, src }: { poster: string; src: string }) {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => setShowVideo((prev) => !prev), 3500);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full h-56 overflow-hidden rounded-br-2xl border-l border-border bg-black relative flex items-center justify-center">
      {showVideo ? (
        <video
          src={src}
          controls
          className="w-full h-full object-cover rounded-br-2xl"
          poster={poster}
        />
      ) : (
        <img
          src={poster}
          alt="Înainte video"
          className="w-full h-full object-cover"
        />
      )}
      <div className="absolute top-2 right-2 text-xs px-2 py-1 rounded bg-background/80 shadow">
        {showVideo ? "După" : "Înainte"}
      </div>
    </div>
  );
}