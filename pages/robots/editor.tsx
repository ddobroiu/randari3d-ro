import { useState } from "react";
import { useSession } from "next-auth/react";
import GeneratorLayout from "@/components/generator/GeneratorLayout";
import SmartForm from "@/components/generator/SmartForm";
import { ROBOTS } from "@/lib/robots-config";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { FaDownload } from "react-icons/fa";

export default function DesignPage() {
  const { data: session, update } = useSession();
  const config = ROBOTS["editor"]; // <--- Schimbă aici în "create" sau "editor" pentru celelalte pagini

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);

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

  return (
    <GeneratorLayout title={config.title} description={config.description} errorMsg={error}>
      <SmartForm config={config} loading={loading} onSubmit={handleGenerate} />
      <div className="bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl border border-slate-200 dark:border-[#23263a] rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center relative">
        {!result && !loading && (
            <div className="text-slate-400 text-center">
                <div className="text-6xl mb-4 opacity-20">🎨</div>
                <p>Așteptăm input-ul tău.</p>
            </div>
        )}
        {loading && (
            <div className="text-center animate-pulse">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6 mx-auto"></div>
                <p>Google Imagen desenează...</p>
            </div>
        )}
        {result && (
            <div className="w-full animate-fade-in space-y-4">
                {original ? (
                    <ReactCompareSlider 
                        itemOne={<ReactCompareSliderImage src={original} alt="Original" />}
                        itemTwo={<ReactCompareSliderImage src={result} alt="Rezultat" />}
                        className="rounded-xl shadow-lg h-[400px]"
                    />
                ) : (
                    <img src={result} className="rounded-xl shadow-lg w-full max-h-[400px] object-contain" />
                )}
                <div className="flex justify-center">
                    <a href={result} download="rezultat.png" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition"><FaDownload/> Descarcă</a>
                </div>
            </div>
        )}
      </div>
    </GeneratorLayout>
  );
}