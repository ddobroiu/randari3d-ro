import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import dynamic from "next/dynamic";
import { FaVideo, FaPaintRoller, FaMagic, FaEraser, FaArrowRight } from "react-icons/fa";

const Panorama = dynamic(() => import("@/components/Panorama"), { ssr: false });

function AutoImageSwitcher({ before, after }: { before: string; after: string }) {
  const [showAfter, setShowAfter] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setShowAfter((p) => !p), 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="w-full h-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 relative bg-black/5">
      <img
        src={showAfter ? after : before}
        alt="Comparație AI"
        className="w-full h-full object-cover transition-all duration-700 ease-in-out"
      />
      <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
        {showAfter ? "AI" : "Original"}
      </div>
    </div>
  );
}

type HomeHistoryItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  robot: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [history, setHistory] = useState<HomeHistoryItem[]>([]);

  const studios = [
    {
      id: "video",
      title: "Studio Video",
      desc: "Transformă imagini statice în videoclipuri cinematice folosind Google Veo.",
      link: "/robots/video",
      icon: <FaVideo className="text-blue-500" />,
      preview: (
        <div className="w-full h-48 bg-black rounded-xl overflow-hidden relative border border-slate-200 dark:border-slate-700 flex items-center justify-center group">
           <img src="/Imagine-Video-inainte.jpg" className="w-full h-full object-cover opacity-80" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-110 transition">
                <FaVideo className="text-white text-xl" />
             </div>
           </div>
        </div>
      )
    },
    {
      id: "design",
      title: "Studio Design",
      desc: "Reamenajează interioare. Încarcă o poză și schimbă stilul instant.",
      link: "/robots/design",
      icon: <FaPaintRoller className="text-purple-500" />,
      preview: <AutoImageSwitcher before="/Imagine-Decorare-Cameră-inainte.jpg" after="/Imagine-Decorare-Cameră-dupa.jpg" />
    },
    {
      id: "create",
      title: "Studio Creație",
      desc: "Generează imagini, texturi și concepte vizuale de la zero din text.",
      link: "/robots/create",
      icon: <FaMagic className="text-pink-500" />,
      preview: (
        <div className="w-full h-48 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <img src="/Imagine+Prompt-dupa.jpg" className="w-full h-full object-cover hover:scale-105 transition duration-700" />
        </div>
      )
    },
    {
      id: "editor",
      title: "Studio Editor",
      desc: "Modifică poze existente: șterge obiecte sau schimbă elemente.",
      link: "/robots/editor",
      icon: <FaEraser className="text-orange-500" />,
      preview: <AutoImageSwitcher before="/Imagine-Eliminare-inainte.jpg" after="/Imagine-Eliminare-dupa.jpg" />
    }
  ];

  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/history-latest")
        .then((res) => res.json())
        .then((data) => setHistory(data.history || []));
    }
  }, [session]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-white font-sans overflow-x-hidden transition-colors duration-300">
      <Head>
        <title>Randări 3D AI – Platformă Completă de Generare</title>
        <meta name="description" content="Generează video, design interior și imagini cu puterea Google AI." />
      </Head>

      {/* HERO SECTION */}
      <div className="relative w-full h-[400px] md:h-[500px]">
        <div className="absolute inset-0 z-0">
            <Panorama image="/panorama.jpg" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-slate-50 dark:to-[#0b0e14] z-10" />
        
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow-lg mb-4 tracking-tight">
                Imaginează. <span className="text-blue-400">Generează.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-200 max-w-2xl drop-shadow-md">
                Platforma ta all-in-one pentru Video AI, Design Interior și Editare Foto.
            </p>
            {!session && (
                <Link href="/register" className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full shadow-xl hover:shadow-blue-500/40 transition transform hover:-translate-y-1">
                    Începe Gratuit
                </Link>
            )}
        </div>
      </div>

      {/* STUDIOURI */}
      <section className="max-w-7xl mx-auto px-6 -mt-20 relative z-30 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {studios.map((studio) => (
                <Link key={studio.id} href={studio.link} className="group">
                    <div className="bg-white dark:bg-[#151a23] rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-[#23263a] hover:shadow-2xl hover:border-blue-500/30 transition h-full flex flex-col">
                        <div className="mb-4">
                            {studio.preview}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                {studio.icon}
                            </div>
                            <h3 className="text-lg font-bold group-hover:text-blue-500 transition">{studio.title}</h3>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex-grow leading-relaxed">
                            {studio.desc}
                        </p>
                        <div className="mt-4 flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0 duration-300">
                            Deschide Studio <FaArrowRight className="ml-2 text-xs" />
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </section>

      {/* ISTORIC RECENT */}
      {session && history.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Ultimele tale creații</h2>
            <Link href="/dashboard" className="text-blue-600 hover:underline text-sm font-semibold">Vezi tot istoricul</Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {history.slice(0, 4).map((item) => (
              <div key={item.id} className="bg-white dark:bg-[#151a23] rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-[#23263a] group">
                <div className="h-40 overflow-hidden relative bg-black/5">
                    {/* AICI AM MODIFICAT: object-contain */}
                    {(item.imageUrl.startsWith("data:video") || item.robot.includes("video") || item.imageUrl.endsWith(".mp4")) ? (
                        <video src={item.imageUrl} className="w-full h-full object-cover" />
                    ) : (
                        <img src={item.imageUrl} alt="History" className="w-full h-full object-contain group-hover:scale-105 transition duration-500" />
                    )}
                </div>
                <div className="p-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                            {item.robot}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{item.prompt}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}