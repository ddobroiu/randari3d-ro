import { useState } from "react";
import { useSession } from "next-auth/react";
import GeneratorLayout from "@/components/generator/GeneratorLayout";
import SmartForm from "@/components/generator/SmartForm";
import { ROBOTS } from "@/lib/robots-config";
import { FaInfoCircle } from "react-icons/fa";

export default function VideoPage() {
  const { data: session, update } = useSession();
  const config = ROBOTS["video"];
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGenerate = async (formData: FormData, previewUrl: string | null) => {
    setLoading(true); setError(null); setSuccess(false);
    try {
      const res = await fetch(config.endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare.");
      
      if (session) update({ user: { ...session.user, credits: session.user.credits - config.credits } });
      setSuccess(true); // Afișăm mesaj că e gata și e în dashboard
    } catch (err: any) { setError(err.message); } 
    finally { setLoading(false); }
  };

  return (
    <GeneratorLayout title={config.title} description={config.description} errorMsg={error}>
      <SmartForm config={config} loading={loading} onSubmit={handleGenerate} />
      <div className="bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl border border-slate-200 dark:border-[#23263a] rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col items-center justify-center text-center">
        {success ? (
            <div className="animate-fade-in">
                <FaInfoCircle className="text-5xl text-green-500 mb-4 mx-auto"/>
                <h3 className="text-2xl font-bold text-green-600">Generare Începută!</h3>
                <p className="text-slate-500 mt-2">Videoclipul se procesează în fundal. Îl vei găsi în Dashboard în 1-2 minute.</p>
                <a href="/dashboard" className="mt-6 inline-block bg-blue-600 text-white px-6 py-2 rounded-full font-bold hover:bg-blue-700 transition">Mergi la Dashboard</a>
            </div>
        ) : (
            <div className="text-slate-400">
                <div className="text-6xl mb-4 opacity-20">🎬</div>
                <p>Încarcă imaginea și dă start.</p>
            </div>
        )}
      </div>
    </GeneratorLayout>
  );
}