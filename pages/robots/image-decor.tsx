"use client";

import { useState, useEffect, useRef } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import { useSession } from "next-auth/react";
import Head from "next/head";
import {
  FaDownload,
  FaShoppingCart,
  FaComments,
  FaMagic,
  FaExclamationTriangle,
  FaImage,
  FaTimes,
  FaPen,
  FaTrash,
} from "react-icons/fa";

interface HistoryItem {
  image: string;
  prompt: string;
  date: string;
}

const DECOR_PRESETS = [
  "Stil scandinav",
  "Stil industrial",
  "Stil minimalist",
  "Stil boho",
];

export default function ImageDecorPage() {
  const { data: session, update } = useSession();
  const [prompt, setPrompt] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Debounce referință
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => setHistory(data.history || []))
      .catch(() => {});
    // Cleanup preview-uri când componenta se demontează
    return () => {
      if (originalPreview) URL.revokeObjectURL(originalPreview);
    };
  }, [originalPreview]);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const translatePrompt = async (text: string) => {
    try {
      const r = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ro&tl=en&dt=t&q=${encodeURIComponent(
          text
        )}`
      );
      const d = await r.json();
      return d[0]?.map((t: any) => t[0]).join(" ") || text;
    } catch {
      return text;
    }
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
    const r = await fetch("/api/generate-image-decor", {
      method: "POST",
      body: formData,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Generare eșuată");
    return Array.isArray(d.result.output) ? d.result.output[0] : d.result.output;
  };

  // Prompt preset pentru generarea inițială
  const getDecorPrompt = (userStyle: string) =>
    `Decorează această cameră în stilul ${userStyle.trim()}.`;

  const process = async (useEdit = false) => {
    setErrorMsg(null);

    if (!session?.user) {
      showError("⚠️ Trebuie să fii autentificat pentru a genera imagini.");
      return;
    }

    if ((!prompt && !editPrompt) || (!imageFile && !result)) {
      showError("⚠️ Te rugăm să selectezi o imagine și să alegi stilul de decorare.");
      return;
    }

    try {
      setLoading(true);

      await consumeCredit(10);

      const inputImage = useEdit
        ? await fetch(result!).then((res) =>
            res.blob().then(
              (blob) =>
                new File([blob], "prev.png", { type: blob.type })
            )
          )
        : imageFile!;

      let promptToTranslate;
      if (useEdit) {
        promptToTranslate = editPrompt;
      } else {
        promptToTranslate = getDecorPrompt(prompt);
      }

      const translated = await translatePrompt(promptToTranslate);

      const form = new FormData();
      form.append("prompt", translated);
      form.append("image", inputImage);

      const out = await generateImage(form);
      setResult(out);

      const date = new Date().toLocaleString();
      const record = { image: out, prompt: useEdit ? editPrompt : prompt, date };
      setHistory((prev) => [record, ...prev].slice(0, 4));

      await fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      });

      if (!useEdit && imageFile) {
        // Revoke vechiul preview dacă există
        if (originalPreview) URL.revokeObjectURL(originalPreview);
        setOriginalPreview(URL.createObjectURL(imageFile));
      }
      setPrompt("");
      setEditPrompt("");
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

  // Debounce la input prompt
  const handlePromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => setPrompt(value), 200);
  };

  // Debounce la edit prompt
  const handleEditPromptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => setEditPrompt(value), 200);
  };

  return (
    <>
      <Head>
        <title>Decorare Cameră cu AI – Stiluri, Recomandări și Istoric | Randări 3D</title>
        <meta name="description" content="Decorează camere cu inteligență artificială în stil scandinav, industrial, minimalist sau boho. Încarcă o poză, alege stilul și generează instant decorul ideal. Recomandări produse, istoric și chat AI." />
        {/* ... restul meta tags ... */}
      </Head>
      <main className="min-h-screen py-10 px-2 sm:px-6 md:px-12 bg-transparent text-slate-900 dark:text-white font-sans transition-colors">
        {/* Alertă eroare - fade */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="max-w-3xl mx-auto mb-5 flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-200 border border-red-300 dark:border-red-800 px-6 py-3 rounded-xl shadow-md transition-opacity duration-500 opacity-100"
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
                  const file = e.target.files?.[0] || null;
                  setImageFile(file);
                  if (originalPreview && file) URL.revokeObjectURL(originalPreview);
                  setOriginalPreview(
                    file ? URL.createObjectURL(file) : null
                  );
                }}
                className="hidden"
                aria-label="Încarcă imagine"
              />
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Previzualizare imagine încărcată"
                  loading="lazy"
                  className="absolute w-24 h-16 rounded-md shadow top-3 right-3 object-cover border-2 border-white"
                />
              )}
            </label>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="prompt" className="text-xs text-slate-500">În ce stil vrei să decorezi această cameră?</label>
                <span className="text-xs text-slate-400">Stiluri preset</span>
              </div>
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={handlePromptChange}
                placeholder="ex: Stil scandinav"
                className="w-full rounded-lg mt-1 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 outline-none bg-white dark:bg-[#1c2230] transition"
                aria-label="Stil decorare cameră"
              />
            </div>

            {/* Preseturi */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {DECOR_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-slate-100 dark:bg-[#20263b] hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white text-xs font-medium transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none"
                  aria-label={`Selectează stilul ${p}`}
                >
                  <FaMagic className="text-blue-500 dark:text-purple-400" size={14} aria-hidden="true" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>

            {/* Buton generează */}
            <button
              onClick={() => process(false)}
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105 transition ${loading ? "opacity-70 cursor-not-allowed" : ""} focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none`}
              aria-label="Generează decorare cameră"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Se generează..."></span>
              ) : (
                <>Decorează camera – 10 credite</>
              )}
            </button>

            {/* Chat & Recomandare */}
            {result && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <a href={`/chat?image=${encodeURIComponent(result)}`} target="_blank" rel="noreferrer" aria-label="Chat despre imagine generată">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-[#182346] text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-[#20447a] text-xs font-semibold transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 outline-none">
                    <FaComments size={14} aria-hidden="true" /> Chat despre imagine
                  </div>
                </a>
                <a href={`/recomandare?image=${encodeURIComponent(result)}`} target="_blank" rel="noreferrer" aria-label="Recomandă produse pentru imagine generată">
                  <div className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-[#1a4630] text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-[#25764d] text-xs font-semibold transition focus:ring-2 focus:ring-green-400 dark:focus:ring-green-700 outline-none">
                    <FaShoppingCart size={14} aria-hidden="true" /> Recomandă produse
                  </div>
                </a>
              </div>
            )}
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
                aria-label="Descarcă imaginea generată"
              >
                <FaDownload aria-hidden="true" /> Descarcă
              </button>
            )}

            <div className="rounded-xl overflow-hidden shadow-xl border-2 border-slate-200 dark:border-[#21263b] relative">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalPreview || "/Imagine-Decorare-Cameră-inainte.jpg"}
                    alt="Imagine originală încărcată"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={result || "/Imagine-Decorare-Cameră-dupa.jpg"}
                    alt="Imagine decorată generată"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                className="rounded-xl"
              />
            </div>
            {result && (
              <>
                <label htmlFor="editPrompt" className="sr-only">Prompt pentru redecorare</label>
                <input
                  id="editPrompt"
                  type="text"
                  value={editPrompt}
                  onChange={handleEditPromptChange}
                  placeholder="Scrie un alt stil sau prompt pentru redecorare..."
                  className="w-full px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white/70 dark:bg-[#1c2230]/70 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-700 outline-none my-2 transition"
                  aria-label="Prompt redecorare"
                />
                <button
                  onClick={() => process(true)}
                  disabled={loading}
                  className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold bg-gradient-to-r from-green-600 via-emerald-600 to-emerald-700 hover:scale-105 text-white ${rounded} shadow-md transition ${loading ? "opacity-70 cursor-not-allowed" : ""} focus:ring-2 focus:ring-green-400 dark:focus:ring-green-700 outline-none`}
                  aria-label="Aplică redecorarea"
                >
                  {loading ? "Se aplică redecorarea..." : "Aplică redecorarea – 10 credite"}
                </button>
              </>
            )}
          </div>
        </div>
        {/* ISTORIC */}
        {history.length > 0 && (
          <div className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-10 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-4 tracking-tight text-center">
              Istoric decorări
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative ${glass} ${border} rounded-xl p-2 shadow-lg hover:scale-105 hover:z-10 hover:shadow-2xl transition`}
                >
                  <img
                    src={item.image || ""}
                    alt={`Imagine decorare generată ${idx + 1}: ${item.prompt}`}
                    loading="lazy"
                    className="w-full h-36 object-cover rounded-lg cursor-pointer transition group-hover:opacity-85"
                    onClick={() => setModalImage(item.image)}
                  />
                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-200">
                    <div className="truncate">{item.prompt}</div>
                    <div className="text-[10px] text-slate-400">{item.date}</div>
                  </div>
                  {/* butoane acțiune overlay */}
                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => setResult(item.image)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-blue-400 outline-none"
                      aria-label="Editează această decorare"
                    >
                      <FaPen aria-hidden="true" /> Editează
                    </button>
                    <button
                      onClick={() => item.image && window.open(item.image, "_blank", "noopener,noreferrer")}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-purple-600 outline-none"
                      aria-label="Descarcă această imagine decorată"
                    >
                      <FaDownload aria-hidden="true" /> Descarcă
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-400 outline-none"
                      aria-label="Șterge această decorare"
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
            aria-label="Previzualizare imagine decorată"
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
                loading="lazy"
                className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]"
                alt="Imagine decorată previzualizare"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}