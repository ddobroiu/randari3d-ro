"use client";

import { useState, useEffect } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useSession } from "next-auth/react";
import Head from "next/head";
import {
  FaDownload,
  FaExclamationTriangle,
  FaImage,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

interface HistoryItem {
  image: string | null;
  date: string;
}

export default function ImageRemoveBgPage() {
  const { data: session, update } = useSession();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {});
  }, []);

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

  const generateImage = async (formData: FormData) => {
    const r = await fetch("/api/generate-image-remove-bg", {
      method: "POST",
      body: formData,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Generare eșuată");
    return Array.isArray(d.result.output) ? d.result.output[0] : d.result.output;
  };

  const process = async () => {
    setErrorMsg(null);

    if (!session?.user) {
      showError("⚠️ Trebuie să fii autentificat pentru a genera imagini.");
      return;
    }

    if (!imageFile) {
      showError("⚠️ Te rugăm să selectezi o imagine.");
      return;
    }

    try {
      setLoading(true);

      await consumeCredit(10);

      const form = new FormData();
      form.append("image", imageFile);

      const out = await generateImage(form);
      setResult(out);

      const date = new Date().toLocaleString();
      const record = { image: out, date };
      setHistory((prev) => [record, ...prev].slice(0, 4));

      await fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      });

      // Folosim FileReader pentru a păstra previzualizarea corectă
      const previewURL = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      setOriginalPreview(previewURL);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("credit")) {
        showError("⚠️ Nu ai suficiente credite pentru a genera imaginea.");
      } else {
        showError(`⚠️ ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const updated = [...history];
    updated.splice(index, 1);
    setHistory(updated);

    await fetch("/api/history/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ image: history[index].image }),
    });
  };

  // Design colors
  const gradientBtn = "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-xl transition";
  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  return (
    <>
      <Head>
        <title>Elimină Fundalul Imaginilor cu AI | Randări 3D</title>
        <meta name="description" content="Elimină rapid fundalul imaginilor cu AI. Încarcă poza, vezi comparația, descarcă PNG transparent. Istoric, previzualizare și gestionare imagini fără fundal." />
        <meta property="og:title" content="Elimină Fundalul Imaginilor cu AI | Randări 3D" />
        <meta property="og:description" content="Elimină rapid fundalul imaginilor cu AI. Încarcă poza, vezi comparația, descarcă PNG transparent. Istoric, previzualizare și gestionare imagini fără fundal." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/robots/image-remove-bg" />
        <meta property="og:image" content="https://randari3d.ro/og-image-remove-bg.jpg" />
        <meta name="twitter:title" content="Elimină Fundalul Imaginilor cu AI | Randări 3D" />
        <meta name="twitter:description" content="Elimină rapid fundalul imaginilor cu AI. Încarcă poza, vezi comparația, descarcă PNG transparent. Istoric, previzualizare și gestionare imagini fără fundal." />
        <meta name="twitter:image" content="https://randari3d.ro/og-image-remove-bg.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/robots/image-remove-bg" />
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
          <div className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-4`}>
            {/* Cutie încărcare poză */}
            <label
              htmlFor="upload-image"
              className={`group flex flex-col items-center justify-center min-h-[110px] w-full border-2 border-dashed border-slate-300 dark:border-[#37405a] ${rounded} cursor-pointer hover:border-blue-500 transition relative bg-slate-50/50 dark:bg-[#161b27]/40`}
            >
              <FaImage size={34} className="text-blue-500 group-hover:scale-110 transition mb-2" aria-hidden="true" />
              <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
                Trage o imagine aici,<br />sau apasă pentru a încărca
              </span>
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null);
                  setOriginalPreview(null);
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

            {/* Buton elimină fundal */}
            <button
              onClick={process}
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105 transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none`}
              aria-label="Elimină fundalul imaginii"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Procesare..." />
              ) : (
                <>Elimină fundalul – 10 credite</>
              )}
            </button>
          </div>

          {/* PREVIEW (Dreapta) */}
          <div className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-5 relative`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent tracking-tight">Previzualizare</h2>
            </div>

            {/* Buton descarcă */}
            {result && (
              <button
                onClick={() => window.open(result, "_blank", "noopener,noreferrer")}
                className="absolute top-6 right-10 z-20 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow-lg transition font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                title="Descarcă imaginea (se deschide într-un tab nou)"
                aria-label="Descarcă imaginea fără fundal"
              >
                <FaDownload aria-hidden="true" /> Descarcă
              </button>
            )}

            <div className="rounded-xl overflow-hidden shadow-xl border-2 border-slate-200 dark:border-[#21263b] relative aspect-[4/3] bg-[#d3d3d3] flex items-center justify-center">
              <ReactCompareSlider
                className="w-full h-full"
                itemOne={
                  <ReactCompareSliderImage
                    src={originalPreview || "/Imagine-removebg-inainte.jpg"}
                    alt="Imagine originală încărcată"
                    style={{
                      objectFit: "contain",
                      height: "100%",
                      backgroundColor: "#ccc",
                    }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={result || "/Imagine-removebg-dupa.jpg"}
                    alt="Imagine fără fundal generată"
                    style={{
                      objectFit: "contain",
                      height: "100%",
                      backgroundColor: "#fff",
                    }}
                  />
                }
              />
            </div>
          </div>
        </div>

        {/* ISTORIC */}
        {history.length > 0 && (
          <div className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-10 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-4 tracking-tight text-center">
              Istoric imagini fără fundal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative ${glass} ${border} rounded-xl p-2 shadow-lg hover:scale-105 hover:z-10 hover:shadow-2xl transition`}
                >
                  <img
                    src={item.image || ""}
                    alt={`Imagine fără fundal generată ${idx + 1}`}
                    className="w-full h-36 object-cover rounded-lg cursor-pointer transition group-hover:opacity-85"
                    onClick={() => setModalImage(item.image)}
                    loading="lazy"
                  />
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-200">
                    <div className="text-[10px] text-slate-400">{item.date}</div>
                  </div>
                  {/* buton șterge */}
                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => item.image && window.open(item.image, "_blank", "noopener,noreferrer")}
                      className="flex-1 bg-blue-700 hover:bg-blue-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-blue-400 outline-none"
                      aria-label="Descarcă imaginea fără fundal"
                    >
                      <FaDownload aria-hidden="true" /> Descarcă
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-400 outline-none"
                      aria-label="Șterge imaginea din istoric"
                    >
                      <FaTrash aria-hidden="true" /> Șterge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal imagine */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
            onClick={() => setModalImage(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Previzualizare imagine fără fundal"
          >
            <div className="relative max-w-3xl w-full p-5">
              <button
                onClick={() => setModalImage(null)}
                className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition focus:ring-2 focus:ring-blue-700 outline-none"
                aria-label="Închide previzualizarea"
              >
                <FaTimes size={20} aria-hidden="true" />
              </button>
              <img
                src={modalImage}
                className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]"
                alt="Imagine fără fundal previzualizare"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}