"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import dynamic from "next/dynamic";
import {
  FaDownload,
  FaExclamationTriangle,
  FaImage,
  FaTimes,
} from "react-icons/fa";

const ModelViewer = dynamic(() => import("../../components/ModelViewer"), { ssr: false });

export default function ThreeDImagePage() {
  const { data: session, update } = useSession();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelKey, setModelKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<
    { image: string; video?: string; model?: string; date: string }[]
  >([]);

  // Variabilă pentru modal video/imagine
  const [modalModel, setModalModel] = useState<string | null>(null);

  const credits = session?.user?.credits || 0;

  const gradientBtn =
    "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-xl transition";
  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const consumeCredit = async (amount: number) => {
    const r = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Eroare la credit");
    if (session?.user) {
      session.user.credits -= amount;
      update({ user: { ...session.user } });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imageFile) {
      showError("Încarcă o imagine înainte.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    setVideoUrl(null);
    setModelUrl(null);

    const localUrl = URL.createObjectURL(imageFile);
    setOriginalPreview(localUrl);

    try {
      await consumeCredit(10);

      const formData = new FormData();
      formData.append("image", imageFile);

      const res = await fetch("/api/generate-3d-image", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || (!data.video && !data.model)) {
        throw new Error(data.error || "Modelul nu a returnat un video sau fișier 3D.");
      }

      setVideoUrl(data.video || null);
      setModelUrl(data.model || null);
      setModelKey((k) => k + 1);

      const date = new Date().toLocaleString();
      const record = {
        image: localUrl,
        video: data.video || null,
        model: data.model || null,
        date,
      };

      setHistory((prev) => [record, ...prev].slice(0, 5));

      await fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      });
    } catch (err: any) {
      showError(err.message || "Eroare necunoscută.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const toDelete = history[index];
    setHistory((prev) => prev.filter((_, i) => i !== index));

    await fetch("/api/history/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: toDelete.image }),
    });
  };

  return (
    <>
      <Head>
        <title>Imagine ➜ Model 3D + Video | Generare și Istoric | Randări 3D</title>
        <meta
          name="description"
          content="Generează modele 3D și videoclipuri AI din imagine. Transformă spațiul cu stiluri moderne și materiale realiste. Istoric și descărcare rapidă."
        />
        <link rel="canonical" href="https://randari3d.ro/robots/3d-image" />
      </Head>
      <main className="min-h-screen py-10 px-2 sm:px-6 md:px-12 bg-transparent text-slate-900 dark:text-white font-sans transition-colors">
        {/* Alertă eroare */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="max-w-3xl mx-auto mb-5 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-800 px-6 py-3 rounded-xl shadow-md animate-bounce"
          >
            <FaExclamationTriangle className="text-red-600 dark:text-red-300" aria-hidden="true" /> {errorMsg}
          </div>
        )}

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* FORMULAR (Stânga) */}
          <form
            onSubmit={handleSubmit}
            className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-6`}
            noValidate
          >
            <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent tracking-tight">
              Imagine ➔ Model 3D + Video
            </h1>

            <label
              htmlFor="upload-image"
              className={`group flex flex-col items-center justify-center min-h-[110px] w-full border-2 border-dashed border-slate-300 dark:border-[#37405a] ${rounded} cursor-pointer hover:border-blue-500 transition relative bg-slate-50/50 dark:bg-[#161b27]/40`}
            >
              <FaImage size={34} className="text-blue-500 group-hover:scale-110 transition mb-2" aria-hidden="true" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                Trage o imagine aici,<br />
                sau apasă pentru a încărca
              </span>
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null);
                  setOriginalPreview(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null);
                }}
                className="hidden"
                aria-label="Încarcă imagine"
              />
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Previzualizare imagine încărcată"
                  className="absolute w-24 h-16 rounded-md shadow top-3 right-3 object-cover border-2 border-white"
                  loading="lazy"
                />
              )}
            </label>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105 transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none`}
              aria-label="Generează model 3D și video"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Procesare..."></span>
              ) : (
                <>Generează 3D + Video – 10 credite</>
              )}
            </button>
          </form>

          {/* PREVIZUALIZARE (Dreapta) */}
          <section className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-6 min-h-[500px] relative`}>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent tracking-tight mb-4 text-center">
              Previzualizare
            </h2>

            {loading && (
              <div className="text-center text-lg animate-pulse text-slate-600 dark:text-slate-400">
                ⏳ Se generează rezultatul...
              </div>
            )}

            {!loading && originalPreview && videoUrl && (
              <ReactCompareSlider
                itemOne={
                  <img
                    src={originalPreview}
                    alt="Imagine inițială"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                itemTwo={
                  <video
                    src={videoUrl}
                    controls
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                    poster={originalPreview}
                  />
                }
                className="rounded-xl shadow-lg"
              />
            )}

            {!loading && !videoUrl && originalPreview && (
              <img
                src={originalPreview}
                alt="Imagine încărcată"
                className="w-full rounded-lg shadow-lg object-contain max-h-[480px]"
              />
            )}

            {/* Buton descarcă video */}
            {videoUrl && (
              <button
                onClick={() => window.open(videoUrl, "_blank", "noopener,noreferrer")}
                className="absolute top-6 right-10 z-20 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow-lg transition font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                title="Descarcă video (se deschide într-un tab nou)"
                aria-label="Descarcă video generat"
              >
                <FaDownload aria-hidden="true" /> Descarcă video
              </button>
            )}

            {/* Dacă vrei poți afișa și modelul 3D separat */}
            {!loading && modelUrl && (
              <div className="mt-6">
                <ModelViewer key={modelKey} url={modelUrl} />
              </div>
            )}
          </section>
        </div>

        {/* ISTORIC */}
        {history.length > 0 && (
          <section className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-12 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-6 tracking-tight text-center">
              Istoric generări
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="group bg-white/80 dark:bg-[#161b27]/80 rounded-xl p-4 shadow-lg hover:scale-105 transition space-y-3 relative"
                >
                  {item.video ? (
                    <video
                      src={item.video}
                      controls
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600"
                      onClick={() => setModalModel(item.video!)}
                      style={{ cursor: "pointer" }}
                    />
                  ) : item.model ? (
                    <ModelViewer
                      url={item.model}
                      key={`model-${i}`}
                    />
                  ) : (
                    <img
                      src={item.image || ""}
                      alt="Imagine originală"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 object-contain max-h-48"
                      onClick={() => setModalModel(item.image!)}
                      style={{ cursor: "pointer" }}
                    />
                  )}
                  <div className="text-xs text-slate-700 dark:text-slate-200 mt-2">{item.date}</div>

                  {/* Overlay butoane */}
                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    {item.video && (
                      <button
                        onClick={() => window.open(item.video!, "_blank", "noopener,noreferrer")}
                        className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-purple-600 outline-none"
                        aria-label="Descarcă video generat"
                      >
                        <FaDownload aria-hidden="true" /> Descarcă
                      </button>
                    )}
                    {item.model && (
                      <button
                        onClick={() => window.open(item.model!, "_blank", "noopener,noreferrer")}
                        className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-purple-600 outline-none"
                        aria-label="Descarcă model 3D"
                      >
                        <FaDownload aria-hidden="true" /> Descarcă 3D
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(i)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-400 outline-none"
                      aria-label="Șterge generarea"
                    >
                      Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Modal video / imagine */}
        {modalModel && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
            onClick={() => setModalModel(null)}
            role="dialog"
            aria-modal="true"
            aria-label={modalModel.endsWith(".mp4") ? "Previzualizare video generat" : "Previzualizare imagine generată"}
          >
            <div className="relative max-w-3xl w-full p-5">
              <button
                onClick={() => setModalModel(null)}
                className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition focus:ring-2 focus:ring-blue-700 outline-none"
                aria-label="Închide previzualizarea"
              >
                <FaTimes size={20} aria-hidden="true" />
              </button>

              {modalModel.endsWith(".mp4") ? (
                <video
                  src={modalModel}
                  controls
                  className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]"
                />
              ) : (
                <img
                  src={modalModel}
                  alt="Media generat"
                  className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}