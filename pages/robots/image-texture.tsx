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
  FaPen,
  FaTrash,
  FaMagic,
} from "react-icons/fa";

interface HistoryItem {
  image: string | null;
  prompt: string;
  date: string;
}

const OBJECT_PRESETS = [
  "canapea",
  "pereți",
  "dulap",
  "masă",
];

const TEXTURE_PRESETS = [
  "catifea albastră",
  "lemn deschis",
  "piatră naturala",
  "beton aparent",
];

export default function ImageTexturePage() {
  const { data: session, update } = useSession();
  const [object, setObject] = useState("");
  const [texture, setTexture] = useState("");
  const [editPrompt, setEditPrompt] = useState("");
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
      const remaining = typeof d.remaining === "number" ? d.remaining : (session.user.credits - amount);
      // Avoid mutating session object directly; pass a new object to update()
      update({ user: { ...session.user, credits: remaining } });
    }
  };

  const generateImage = async (formData: FormData) => {
    const r = await fetch("/api/generate-image-texture", {
      method: "POST",
      body: formData,
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Generare eșuată");
    return Array.isArray(d.result.output) ? d.result.output[0] : d.result.output;
  };

  const process = async (useEdit = false) => {
    setErrorMsg(null);

    if (!session?.user) {
      showError("⚠️ Trebuie să fii autentificat pentru a genera imagini.");
      return;
    }

    if (
      (!object || !texture) && !useEdit ||
      (!imageFile && !result)
    ) {
      showError("⚠️ Te rugăm să selectezi o imagine, obiect și textură.");
      return;
    }

    try {
      setLoading(true);

      await consumeCredit(10);

      const inputImage = useEdit
        ? await fetch(result!).then((res) =>
            res.blob().then(
              (blob) => new File([blob], "prev.png", { type: blob.type })
            )
          )
        : imageFile!;

      let promptToSend = "";
      if (!useEdit) {
        promptToSend = `schimba textura pentru ${object.trim()} in ${texture.trim()}`;
      } else {
        promptToSend = editPrompt;
      }

      const translated = await translatePrompt(promptToSend);
      const form = new FormData();
      form.append("prompt", translated);
      form.append("image", inputImage);

      const out = await generateImage(form);
      setResult(out);

      const date = new Date().toLocaleString();
      const record = { image: out, prompt: useEdit ? editPrompt : promptToSend, date };
      setHistory((prev) => [record, ...prev].slice(0, 4));

      await fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      });

      if (!useEdit) setOriginalPreview(URL.createObjectURL(imageFile!));
      setObject("");
      setTexture("");
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

  return (
    <>
      <Head>
        <title>Schimbă Textura cu AI – Obiecte, Stiluri, Istoric | Randări 3D</title>
        <meta name="description" content="Schimbă textura obiectelor din imagini cu AI: canapea, pereți, dulap, masă. Selectează texturi moderne: catifea albastră, lemn deschis, piatră naturală, beton aparent. Previzualizare, editare, istoric." />
        {/* ... restul meta tags ... */}
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
                  setOriginalPreview(
                    e.target.files?.[0]
                      ? URL.createObjectURL(e.target.files[0])
                      : null
                  );
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

            {/* Selectează obiectul */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="object" className="text-xs text-slate-500">
                  Ce obiect vrei să schimbi textura?
                </label>
                <span className="text-xs text-slate-400">Exemplu</span>
              </div>
              <input
                id="object"
                type="text"
                value={object}
                onChange={(e) => setObject(e.target.value)}
                placeholder="ex: canapea, pereți, dulap, masă..."
                className="w-full rounded-lg mt-1 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 outline-none bg-white dark:bg-[#1c2230] transition"
                aria-label="Obiect pentru schimbare textură"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                {OBJECT_PRESETS.map((o, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setObject(o)}
                    className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-slate-100 dark:bg-[#20263b] hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white text-xs font-medium transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none"
                    aria-label={`Obiect preset: ${o}`}
                  >
                    <FaMagic className="text-blue-500 dark:text-purple-400" size={14} aria-hidden="true" />
                    <span className="truncate">{o}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Selectează textura */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="texture" className="text-xs text-slate-500">
                  Ce textură vrei?
                </label>
                <span className="text-xs text-slate-400">Exemplu</span>
              </div>
              <input
                id="texture"
                type="text"
                value={texture}
                onChange={(e) => setTexture(e.target.value)}
                placeholder="ex: catifea albastră, lemn deschis, piatră naturala..."
                className="w-full rounded-lg mt-1 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 outline-none bg-white dark:bg-[#1c2230] transition"
                aria-label="Textură pentru obiect"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                {TEXTURE_PRESETS.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTexture(t)}
                    className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-slate-100 dark:bg-[#20263b] hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white text-xs font-medium transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none"
                    aria-label={`Textură preset: ${t}`}
                  >
                    <FaMagic className="text-blue-500 dark:text-purple-400" size={14} aria-hidden="true" />
                    <span className="truncate">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Buton generează */}
            <button
              onClick={() => process(false)}
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105 transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none`}
              aria-label="Schimbă textura obiectului"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Procesare..." />
              ) : (
                <>Schimbă textura – 10 credite</>
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
                aria-label="Descarcă imaginea generată cu textură schimbată"
              >
                <FaDownload aria-hidden="true" /> Descarcă
              </button>
            )}

            <div className="rounded-xl overflow-hidden shadow-xl border-2 border-slate-200 dark:border-[#21263b] relative">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalPreview || "/Imagine-Textura-inainte.jpg"}
                    alt="Imagine originală încărcată"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={result || "/Imagine-Textura-dupa.jpg"}
                    alt="Imagine cu textură schimbată generată"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                className="rounded-xl"
              />
            </div>
            {result && (
              <>
                <label htmlFor="editPrompt" className="sr-only">Prompt editare imagine</label>
                <input
                  id="editPrompt"
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Scrie un prompt nou pentru a edita imaginea..."
                  className="w-full px-3 py-3 rounded-lg border border-slate-300 dark:border-slate-700 text-sm bg-white/70 dark:bg-[#1c2230]/70 focus:ring-2 focus:ring-green-400 dark:focus:ring-green-700 outline-none my-2 transition"
                  aria-label="Prompt editare imagine"
                />
                <button
                  onClick={() => process(true)}
                  disabled={loading}
                  className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold bg-gradient-to-r from-green-600 via-emerald-600 to-emerald-700 hover:scale-105 text-white ${rounded} shadow-md transition focus:ring-2 focus:ring-green-400 dark:focus:ring-green-700 outline-none`}
                  aria-label="Aplică editarea imaginii"
                >
                  {loading ? "Se aplică editarea..." : "Aplică editarea – 10 credite"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ISTORIC */}
        {history.length > 0 && (
          <div className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-10 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-4 tracking-tight text-center">
              Istoric imagini
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative ${glass} ${border} rounded-xl p-2 shadow-lg hover:scale-105 hover:z-10 hover:shadow-2xl transition`}
                >
                  <img
                    src={item.image || ""}
                    alt={`Imagine cu textură schimbată ${idx + 1}: ${item.prompt}`}
                    className="w-full h-36 object-cover rounded-lg cursor-pointer transition group-hover:opacity-85"
                    onClick={() => setModalImage(item.image)}
                    loading="lazy"
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
                      aria-label="Editează imaginea"
                    >
                      <FaPen aria-hidden="true" /> Editează
                    </button>
                    <button
                      onClick={() => item.image && window.open(item.image, "_blank", "noopener,noreferrer")}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-purple-600 outline-none"
                      aria-label="Descarcă imaginea cu textură schimbată"
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
            aria-label="Previzualizare imagine cu textură schimbată"
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
                alt="Imagine cu textură schimbată previzualizare"
                loading="lazy"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}