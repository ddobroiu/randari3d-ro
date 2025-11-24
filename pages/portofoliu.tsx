import { useState, useRef, useCallback } from "react";
import Head from "next/head";
import { 
  ImageIcon, 
  Video, 
  Box, 
  ArrowRightLeft, 
  Sparkles, 
  Layers, 
  Zap,
  Play
} from "lucide-react";

// Datele pentru portofoliu
const robots = [
  {
    title: "Imagine + Prompt ➜ Imagine",
    desc: "Generează o nouă versiune AI păstrând compoziția.",
    type: "image",
    before: "/Imagine+Prompt-Imagine-inainte.jpg",
    after: "/Imagine+Prompt-Imagine-dupa.jpg",
    badge: "Restyling",
  },
  {
    title: "Imagine ➜ Eliminare Obiecte",
    desc: "Curăță imaginile de elemente nedorite.",
    type: "image",
    before: "/Imagine-Eliminare-inainte.jpg",
    after: "/Imagine-Eliminare-dupa.jpg",
    badge: "Cleanup",
  },
  {
    title: "Imagine ➜ Decorare Cameră",
    desc: "Aplică stiluri de design interior peste o schiță.",
    type: "image",
    before: "/Imagine-Decorare-Cameră-inainte.jpg",
    after: "/Imagine-Decorare-Cameră-dupa.jpg",
    badge: "Interior Design",
  },
  {
    title: "Text ➜ Imagine",
    desc: "Transformă cuvintele în artă vizuală.",
    type: "image",
    before: "/Imagine+Prompt-inainte.jpg",
    after: "/Imagine+Prompt-dupa.jpg",
    badge: "Generativ",
  },
  {
    title: "Imagine ➜ Modificare Textură",
    desc: "Schimbă materialele și texturile instant.",
    type: "image",
    before: "/Imagine-Textura-inainte.jpg",
    after: "/Imagine-Textura-dupa.jpg",
    badge: "Materiale",
  },
  {
    title: "Imagine ➜ Remove Background",
    desc: "Decupează subiectul principal automat.",
    type: "image",
    before: "/Imagine-removebg-inainte.jpg",
    after: "/Imagine-removebg-dupa.jpg",
    badge: "Utilitar",
  },
  // VIDEO
  {
    title: "Imagine ➜ Video",
    desc: "Adu la viață imaginile statice.",
    type: "video",
    before: "/Imagine-Video-inainte.jpg",
    after: "/imagine-video-dupa.mp4",
    badge: "Motion",
  },
  {
    title: "Text ➜ Video",
    desc: "Creează scene video din descrieri text.",
    type: "video",
    before: "/Imagine+Prompt-inainte.jpg",
    after: "/imagine-video-dupa.mp4",
    badge: "Cinematic",
  },
  // 3D
  {
    title: "Imagine ➜ Vedere 3D",
    desc: "Transformă 2D în experiență 3D.",
    type: "3d",
    before: "/Imagine-Vedere3D-inainte.jpg",
    after: "/Imagine-Vedere3D-dupa.mp4",
    badge: "Spatial",
  },
];

const tabs = [
  { id: "image", label: "Imagini", icon: ImageIcon },
  { id: "video", label: "Video", icon: Video },
  { id: "3d", label: "3D", icon: Box },
] as const;

export default function PortofoliuPage() {
  const [activeTab, setActiveTab] = useState<"image" | "video" | "3d">("image");
  const filtered = robots.filter((r) => r.type === activeTab);

  return (
    <>
      <Head>
        <title>Portofoliu Transformări AI | Randări 3D</title>
        <meta name="description" content="Vezi puterea AI în acțiune. Compară rezultatele înainte și după pentru generare imagini, video și randări 3D." />
      </Head>

      <main className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Transformări{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                AI Spectaculoase
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Explorează colecția noastră de rezultate. Folosește slider-ul interactiv pentru a vedea diferența exactă dintre original și rezultatul generat de AI.
            </p>
          </div>

          {/* Tabs Navigation */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex p-1.5 bg-secondary/50 backdrop-blur-md rounded-full border border-border shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300
                      ${isActive ? "text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-white/10"}
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-primary rounded-full -z-10 animate-in fade-in zoom-in-95 duration-200" />
                    )}
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grid Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item, i) => (
              <div
                key={i}
                className="group bg-card border border-border rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-300 flex flex-col"
              >
                {/* Header Card */}
                <div className="p-6 pb-4 border-b border-border/50">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                      {item.badge}
                    </span>
                    <Sparkles className="w-4 h-4 text-primary/40 group-hover:text-primary transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                {/* Media Area */}
                <div className="flex-1 bg-secondary/30 relative min-h-[300px] flex flex-col">
                  {item.type === "image" ? (
                    <ComparisonSlider
                      before={item.before}
                      after={item.after}
                      alt={item.title}
                    />
                  ) : (
                    <MediaToggler
                      before={item.before}
                      after={item.after}
                      type={item.type}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

// ------------------------------------------------------------------
// COMPONENTA 1: SLIDER INTERACTIV PENTRU IMAGINI (Drag to compare)
// ------------------------------------------------------------------
function ComparisonSlider({ before, after, alt }: { before: string; after: string; alt: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const { left, width } = containerRef.current.getBoundingClientRect();
      const x = clientX - left;
      const pos = Math.max(0, Math.min(100, (x / width) * 100));
      setPosition(pos);
    }
  }, []);

  const onMouseMove = (e: React.MouseEvent) => handleMove(e.clientX);
  const onTouchMove = (e: React.TouchEvent) => handleMove(e.touches[0].clientX);

  // Funcție pentru click direct pe bară/imagine
  const handleClick = (e: React.MouseEvent) => handleMove(e.clientX);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[320px] cursor-col-resize select-none overflow-hidden"
      onMouseMove={(e) => e.buttons === 1 && onMouseMove(e)}
      onTouchMove={onTouchMove}
      onClick={handleClick}
    >
      {/* 1. Imaginea AFTER (Jos) - Rezultatul Final */}
      <img
        src={after}
        alt={`After ${alt}`}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
      
      {/* 2. Imaginea BEFORE (Sus) - Originalul - decupat */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={before}
          alt={`Before ${alt}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Label Original */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-white/10">
          ORIGINAL
        </div>
      </div>

      {/* Label AI Generated (pentru partea dreaptă, vizibil doar când sliderul nu e la maxim) */}
      <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg border border-white/10 pointer-events-none">
        AI GENERATED
      </div>

      {/* 3. Linia Slider */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white z-20 pointer-events-none shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center text-primary transform hover:scale-110 transition-transform">
          <ArrowRightLeft className="w-4 h-4" />
        </div>
      </div>

      {/* Hint Text */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/70 text-[10px] pointer-events-none drop-shadow-md">
        Trage pentru a compara
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// COMPONENTA 2: MEDIA TOGGLER (Pentru Video/3D)
// ------------------------------------------------------------------
function MediaToggler({ before, after, type }: { before: string; after: string; type: string }) {
  const [view, setView] = useState<"before" | "after">("after");

  return (
    <div className="w-full h-full flex flex-col">
      {/* Zona de vizualizare */}
      <div className="relative flex-1 bg-black w-full min-h-[250px] overflow-hidden group">
        {view === "before" ? (
          <img
            src={before}
            alt="Original Input"
            className="w-full h-full object-cover animate-in fade-in duration-300"
          />
        ) : (
          <video
            src={after}
            controls
            autoPlay
            loop
            muted
            className="w-full h-full object-cover animate-in fade-in duration-300"
            poster={before}
          />
        )}
        
        {/* Play Overlay pentru imagine statică (doar estetic) */}
        {view === "before" && type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
             <div className="bg-black/50 p-3 rounded-full backdrop-blur-sm border border-white/20">
                <Layers className="w-6 h-6 text-white/80" />
             </div>
          </div>
        )}
      </div>

      {/* Controale Toggle */}
      <div className="flex border-t border-border">
        <button
          onClick={() => setView("before")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            view === "before" 
              ? "bg-secondary text-foreground" 
              : "bg-card text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Input Original
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={() => setView("after")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            view === "after" 
              ? "bg-primary/10 text-primary" 
              : "bg-card text-muted-foreground hover:bg-secondary/50"
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Rezultat AI
        </button>
      </div>
    </div>
  );
}