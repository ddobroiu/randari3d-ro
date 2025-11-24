import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router"; // Pt a citi query params
import GeneratorLayout from "@/components/generator/GeneratorLayout";
import SmartForm from "@/components/generator/SmartForm";
import { ROBOTS } from "@/lib/robots-config";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { FaDownload, FaRedo, FaArrowRight } from "react-icons/fa";

export default function DesignPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const config = ROBOTS["design"];

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);
  
  // --- NOU: Imaginea de lanț ---
  const [chainImage, setChainImage] = useState<string | null>(null);

  // La încărcare, verificăm dacă venim din Dashboard cu o imagine
  useEffect(() => {
    // Metoda 1: LocalStorage (pentru Base64 lungi)
    const storedImg = localStorage.getItem("edit_image_temp");
    if (storedImg) {
        setChainImage(storedImg);
        localStorage.removeItem("edit_image_temp"); // Curățăm după folosire
    }
  }, []);

  const handleGenerate = async (formData: FormData, previewUrl: string | null) => {
    setLoading(true); setError(null); setResult(null); setOriginal(previewUrl);
    try {
      const res = await fetch(config.endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare.");
      
      setResult(data.result.output);
      
      if (session) update({ user: { ...session.user, credits: session.user.credits - config.credits } });
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  // Funcția pentru a muta rezultatul în input (Loop)
  const handleChainEdit = () => {
      if (result) {
          setChainImage(result); // Trimitem rezultatul în formular
          setResult(null);       // Resetăm rezultatul curent
          setOriginal(null);     // Resetăm originalul afișat
          window.scrollTo({ top: 0, behavior: 'smooth' }); // Mergem sus la formular
      }
  };

  return (
    <GeneratorLayout title={config.title} description={config.description} errorMsg={error}>
      {/* Trimitem chainImage către formular */}
      {/* Folosim key={chainImage} pentru a forța re-randarea formularului când se schimbă imaginea */}
      <SmartForm 
        key={chainImage} 
        config={config} 
        loading={loading} 
        onSubmit={handleGenerate} 
        initialImage={chainImage} 
      />

      <div className="bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl border border-slate-200 dark:border-[#23263a] rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center relative">
        
        {!result && !loading && (
            <div className="text-slate-400 text-center">
                <div className="text-6xl mb-4 opacity-20">🎨</div>
                <p>Așteptăm input-ul tău.</p>
            </div>
        )}

        {loading && (
            <div className="text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
                <p className="text-purple-600 font-semibold">Google Gemini lucrează...</p>
            </div>
        )}

        {result && (
            <div className="w-full animate-fade-in space-y-6">
                <h3 className="text-center font-bold text-lg text-slate-700 dark:text-slate-200">
                    Rezultat
                </h3>
                
                <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 h-[500px] bg-black/5 dark:bg-white/5 flex items-center justify-center">
                    {original ? (
                        <ReactCompareSlider 
                            itemOne={<ReactCompareSliderImage src={original} alt="Original" style={{ objectFit: "contain", width: "100%", height: "100%" }} />}
                            itemTwo={<ReactCompareSliderImage src={result} alt="Rezultat" style={{ objectFit: "contain", width: "100%", height: "100%" }} />}
                            style={{ width: "100%", height: "100%" }}
                        />
                    ) : (
                        <img src={result} className="w-full h-full object-contain" alt="Rezultat" />
                    )}
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                    <a 
                        href={result} 
                        download="design-interior.png" 
                        className="flex items-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white px-6 py-3 rounded-full font-bold hover:bg-slate-300 transition"
                    >
                        <FaDownload/> Descarcă
                    </a>

                    {/* --- BUTONUL MAGIC DE CHAIN EDITING --- */}
                    <button 
                        onClick={handleChainEdit}
                        className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:-translate-y-1"
                    >
                        <FaRedo /> Folosește ca Bază (Editare în Lanț) <FaArrowRight />
                    </button>
                </div>
            </div>
        )}
      </div>
    </GeneratorLayout>
  );
}