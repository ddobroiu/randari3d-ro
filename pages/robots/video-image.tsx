"use client";

import { useState, useEffect } from "react";
import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import Head from "next/head";
import { FaDownload, FaExclamationTriangle, FaImage, FaMagic, FaTrash, FaTimes } from "react-icons/fa";
import { useSession } from "next-auth/react";

interface HistoryItem {
  video: string | null;
  prompt: string;
  date: string;
  image: string | null;
}

const PROMPT_PRESETS = [
  "Modern living room with ambient light",
  "Blue sofa and natural wood textures",
  "Large windows and natural sunlight",
  "Minimalist space with warm tones",
];

export default function VideoImagePage() {
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null); // video url
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [modalVideo, setModalVideo] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/history?robot=video-image")
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
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ro&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      const d = await r.json();
      return d[0]?.map((t: any) => t[0]).join(" ") || text;
    } catch {
      return text;
    }
  };

  const generateVideo = async (formData: FormData) => {
    const r = await fetch("/api/generate-video-from-image", {
      method: "POST",
      body: formData,
    });
    if (!r.ok) {
      const errorData = await r.json();
      throw new Error(errorData.error || "Generare eșuată");
    }
    const d = await r.json();
    return d.result.output;
  };

  const process = async () => {
    setErrorMsg(null);

    if (!session?.user) {
      showError("⚠️ Trebuie să fii autentificat pentru a genera videoclipuri.");
      return;
    }

    if (!prompt || !imageFile) {
      showError("⚠️ Te rugăm să selectezi o imagine și să scrii un prompt.");
      return;
    }

    try {
      setLoading(true);

      const translated = await translatePrompt(prompt);
      const form = new FormData();
      form.append("prompt", translated);
      form.append("image", imageFile);
      form.append("duration", "5");
      form.append("quality", "standard");

      const out = await generateVideo(form);
      setResult(out);

      const date = new Date().toLocaleString();
      const record = { video: out, prompt, date, image: originalPreview };
      setHistory((prev) => [record, ...prev].slice(0, 4));

      await fetch("/api/history/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ record }),
      });

      setPrompt("");
      setImageFile(null);
      setOriginalPreview(null);
    } catch (e: any) {
      if (e.message?.toLowerCase().includes("credit")) {
        showError("⚠️ Nu ai suficiente credite pentru a genera videoclipul.");
      } else {
        showError(`⚠️ ${e.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index: number) => {
    const updated = [...history];
    const itemToDelete = updated.splice(index, 1)[0];
    setHistory(updated);

    await fetch("/api/history/delete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ video: itemToDelete.video }),
    });
  };

  // Design colors
  const gradientBtn =
    "bg-gradient-to-r from-blue-600 via-blue-500 to-purple-700 hover:from-blue-700 hover:to-purple-800 shadow-xl transition";
  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";
  const rounded = "rounded-2xl";

  return (
    <>
      <Head>
        <title>Imagine + Prompt ➜ Video AI | Generare și Istoric | Randări 3D</title>
        <meta
          name="description"
          content="Generează videoclipuri AI pornind de la imagine + prompt. Transformă spațiul cu stiluri moderne, lumini, texturi și ferestre. Istoric și descărcare rapidă."
        />
        <meta property="og:title" content="Imagine + Prompt ➜ Video AI | Generare și Istoric | Randări 3D" />
        <meta
          property="og:description"
          content="Generează videoclipuri AI pornind de la imagine + prompt. Transformă spațiul cu stiluri moderne, lumini, texturi și ferestre. Istoric și descărcare rapidă."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://randari3d.ro/robots/video-image" />
        <meta property="og:image" content="https://randari3d.ro/og-video-image.jpg" />
        <meta name="twitter:title" content="Imagine + Prompt ➜ Video AI | Generare și Istoric | Randări 3D" />
        <meta
          name="twitter:description"
          content="Generează videoclipuri AI pornind de la imagine + prompt. Transformă spațiul cu stiluri moderne, lumini, texturi și ferestre. Istoric și descărcare rapidă."
        />
        <meta name="twitter:image" content="https://randari3d.ro/og-video-image.jpg" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://randari3d.ro/robots/video-image" />
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
                Drag an image here,
                <br />
                or click to upload
              </span>
              <input
                id="upload-image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0] || null);
                  setOriginalPreview(
                    e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null
                  );
                }}
                className="hidden"
                aria-label="Upload image"
              />
              {originalPreview && (
                <img
                  src={originalPreview}
                  alt="Preview of uploaded image"
                  className="absolute w-24 h-16 rounded-md shadow top-3 right-3 object-cover border-2 border-white"
                  loading="lazy"
                />
              )}
            </label>

            {/* Prompt */}
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="prompt" className="text-xs text-slate-500">
                  Prompt (EN only)
                </label>
                <span className="text-xs text-slate-400">Example</span>
              </div>
              <input
                id="prompt"
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="spacious living room with natural light"
                className="w-full rounded-lg mt-1 border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-700 outline-none bg-white dark:bg-[#1c2230] transition"
                aria-label="Prompt for video generation"
              />
            </div>

            {/* Preseturi */}
            <div className="grid grid-cols-2 gap-2 mb-1">
              {PROMPT_PRESETS.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(p)}
                  className="flex items-center justify-center gap-2 px-2 py-2 rounded-lg bg-slate-100 dark:bg-[#20263b] hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white text-xs font-medium transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none"
                  aria-label={`Prompt preset: ${p}`}
                >
                  <FaMagic className="text-blue-500 dark:text-purple-400" size={14} aria-hidden="true" />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>

            {/* Buton generează */}
            <button
              onClick={process}
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 text-base font-semibold ${gradientBtn} ${rounded} hover:scale-105 transition focus:ring-2 focus:ring-blue-400 dark:focus:ring-purple-700 outline-none`}
              aria-label="Generate video from image"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" aria-label="Procesare..." />
              ) : (
                <>Generate video – 15 credits</>
              )}
            </button>
          </div>

          {/* PREVIEW (Dreapta) */}
          <div className={`${glass} ${border} ${rounded} p-8 shadow-2xl flex flex-col gap-5 relative`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent tracking-tight">
                Preview
              </h2>
            </div>

            {/* Buton descarcă video */}
            {result && (
              <button
                onClick={() => window.open(result || undefined, "_blank", "noopener,noreferrer")}
                className="absolute top-6 right-10 z-20 flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-full shadow-lg transition font-semibold focus:ring-2 focus:ring-blue-400 outline-none"
                title="Download video (opens in new tab)"
                aria-label="Download generated video"
              >
                <FaDownload aria-hidden="true" /> Download
              </button>
            )}

            <div className="rounded-xl overflow-hidden shadow-xl border-2 border-slate-200 dark:border-[#21263b] relative">
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={originalPreview || "/Imagine-Video-inainte.jpg"}
                    alt="Original uploaded image"
                    style={{ objectFit: "cover", height: 300, width: "100%" }}
                  />
                }
                itemTwo={
                  result ? (
                    <video
                      src={result}
                      controls
                      style={{ objectFit: "cover", height: 300, width: "100%" }}
                      poster={originalPreview || "/Imagine-Video-inainte.jpg"}
                    />
                  ) : (
                    <ReactCompareSliderImage
                      src="/imagine-video-dupa.mp4"
                      alt="Generated video"
                      style={{ objectFit: "cover", height: 300, width: "100%" }}
                    />
                  )
                }
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ISTORIC */}
        {history.length > 0 && (
          <div className={`${glass} ${border} ${rounded} max-w-6xl mx-auto mt-10 p-7 shadow-2xl`}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent mb-4 tracking-tight text-center">
              Video history
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  className={`group relative ${glass} ${border} rounded-xl p-2 shadow-lg hover:scale-105 hover:z-10 hover:shadow-2xl transition`}
                >
                  {item.video && (
                    <video
                      src={item.video}
                      controls
                      className="w-full h-36 object-cover rounded-lg cursor-pointer transition group-hover:opacity-85"
                      onClick={() => setModalVideo(item.video!)}
                      poster={item.image || "/Imagine-Video-inainte.jpg"}
                    />
                  )}

                  <div className="mt-2 text-xs text-slate-700 dark:text-slate-200">
                    <div className="truncate">{item.prompt}</div>
                    <div className="text-[10px] text-slate-400">{item.date}</div>
                  </div>
                  {/* butoane acțiune overlay */}
                  <div className="absolute flex gap-1 left-2 right-2 -bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => window.open(item.video || undefined, "_blank", "noopener,noreferrer")}
                      className="flex-1 bg-purple-700 hover:bg-purple-800 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-purple-600 outline-none"
                      aria-label="Download video from history"
                    >
                      <FaDownload aria-hidden="true" /> Download
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="flex-1 bg-red-600 hover:bg-red-700 px-2 py-1 rounded-lg text-white text-xs flex items-center justify-center gap-1 focus:ring-2 focus:ring-red-400 outline-none"
                      aria-label="Delete video from history"
                    >
                      <FaTrash aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal video */}
        {modalVideo && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]"
            onClick={() => setModalVideo(null)}
            role="dialog"
            aria-modal="true"
            aria-label="Preview of generated video"
          >
            <div className="relative max-w-3xl w-full p-5" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setModalVideo(null)}
                className="absolute top-3 right-3 bg-slate-900/90 text-white rounded-full p-2 shadow-lg hover:bg-slate-800 transition focus:ring-2 focus:ring-blue-700 outline-none"
                aria-label="Close video preview"
              >
                <FaTimes size={20} aria-hidden="true" />
              </button>
              <video
                src={modalVideo}
                controls
                className="max-h-[70vh] max-w-full mx-auto rounded-xl shadow-2xl border-4 border-white dark:border-[#23263a]"
              />
            </div>
          </div>
        )}
      </main>
    </>
  );
}