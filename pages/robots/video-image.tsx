import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import GeneratorLayout from "@/components/generator/GeneratorLayout";
import SmartForm from "@/components/generator/SmartForm";
import { ROBOTS } from "@/lib/robots-config";
import { FaDownload } from "react-icons/fa";

export default function VideoImagePage() {
  const { data: session, update } = useSession();
  const config = ROBOTS["video-image"];

  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState(""); // Mesaj pentru utilizator
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [original, setOriginal] = useState<string | null>(null);

  // Funcție de polling (recursivă prin setTimeout)
  const pollStatus = async (operationName: string, prompt: string) => {
    try {
      const res = await fetch("/api/poll-operation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName, prompt }),
      });
      const data = await res.json();

      if (data.status === "succeeded") {
        setResult(data.output);
        setLoading(false);
        setStatusText("Gata!");
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generare eșuată la Google.");
      } else {
        // Încă lucrează... mai întrebăm peste 5 secunde
        setStatusText("Google Veo randează cadrele... (poate dura 1-2 min)");
        setTimeout(() => pollStatus(operationName, prompt), 5000);
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGenerate = async (formData: FormData, previewUrl: string | null) => {
    if (!previewUrl) return setError("Te rugăm să încarci o imagine.");
    
    setLoading(true);
    setStatusText("Inițializăm conexiunea cu Google Vertex AI...");
    setError(null);
    setResult(null);
    setOriginal(previewUrl);

    try {
      // Pasul 1: Start
      const res = await fetch(config.endpoint, {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Eroare la start generare");

      const operationName = data.operationName;
      const promptText = formData.get("prompt") as string;

      // Actualizăm creditele în UI imediat (optimist)
      if (session) {
         // Presupunem 25, backend-ul a scăzut deja
        update({ user: { ...session.user, credits: session.user.credits - 25 } });
      }

      // Pasul 2: Începem Polling-ul
      setStatusText("Cerere acceptată. Așteptăm răspunsul...");
      pollStatus(operationName, promptText);

    } catch (err: any) {
      setError(err.message || "A apărut o problemă.");
      setLoading(false);
    }
  };

  return (
    <GeneratorLayout title={config.title} description={config.description} errorMsg={error}>
      <SmartForm config={config} loading={loading} onSubmit={handleGenerate} />

      <div className="bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl border border-slate-200 dark:border-[#23263a] rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center relative">
        
        {!result && !loading && !original && (
          <div className="text-slate-400 text-center flex flex-col items-center">
            <div className="text-6xl mb-4 opacity-20">🎬</div>
            <p>Încarcă o imagine și apasă "Generează".</p>
          </div>
        )}

        {loading && (
          <div className="text-center animate-pulse flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              Se lucrează...
            </h3>
            <p className="text-slate-500 mt-2 font-mono text-sm">{statusText}</p>
          </div>
        )}

        {result && (
          <div className="w-full h-full flex flex-col gap-6 animate-fade-in-up">
            <div className="bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700 relative group">
                <video 
                    src={result} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-auto max-h-[500px] object-contain mx-auto"
                />
            </div>
            <div className="flex justify-center">
                <a 
                href={result} 
                download="veo-video.mp4"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-8 rounded-full font-bold shadow-lg transition"
                >
                <FaDownload /> Descarcă Video
                </a>
            </div>
          </div>
        )}
      </div>
    </GeneratorLayout>
  );
}