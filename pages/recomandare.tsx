"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { synonyms, whitelist, blacklist } from "@/utils/keywords-map";
import { FaImage, FaSearch, FaExclamationTriangle, FaCheckCircle } from "react-icons/fa";
import { useSession } from "next-auth/react";

interface Product {
  title: string;
  description?: string;
  image_urls: string;
  price: string;
  url: string;
  currency?: string;
  shop?: string;
}

export default function RecomandarePage() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const imageUrl = searchParams.get("image");

  const credits = (session?.user as any)?.credits ?? 0;

  const [keywords, setKeywords] = useState<string[]>([]);
  const [results, setResults] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  const expandKeyword = (kw: string) => synonyms[kw.toLowerCase()] || [kw];

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const consumeCredit = async (amount: number) => {
    const r = await fetch("/api/credits/consume", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error || "Eroare consum credite");
    if (session?.user) {
      session.user.credits -= amount;
      update({ user: { ...session.user } });
    }
  };

  const analyzeImage = async (file: File) => {
    setLoading(true);
    try {
      if (!session) {
        showError("⚠️ Trebuie să fii logat pentru a folosi această funcție.");
        return;
      }

      if (credits < 2) {
        showError("⚠️ Nu ai suficiente credite. Sunt necesare 2 credite.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      await consumeCredit(2);

      const aiRes = await axios.post("/api/analyze-image", formData);
      const { keywords } = aiRes.data;
      setKeywords(keywords);

      showSuccess("✅ Imagine analizată cu succes. 2 credite consumate.");
    } catch (err: any) {
      showError("⚠️ Nu am reușit să analizez imaginea.");
      console.error("Eroare la analiza imaginii:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!imageUrl) return;
    (async () => {
      try {
        setPreview(imageUrl);
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], "imagine.png", { type: blob.type });
        setSelectedFile(file);
      } catch {
        showError("⚠️ Imaginea primită nu poate fi încărcată.");
      }
    })();
    // eslint-disable-next-line
  }, [imageUrl]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSend = async () => {
    if (!selectedFile) {
      showError("⚠️ Te rog să selectezi o imagine.");
      return;
    }
    await analyzeImage(selectedFile);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      if (!keywords.length) return;
      setLoading(true);

      try {
        const res = await axios.get<Product[]>("/api/feed");
        const products = res.data;

        const filtered: Record<string, Product[]> = {};
        keywords.forEach((kw) => {
          const expanded = expandKeyword(kw);
          const include = whitelist[kw] || [];
          const exclude = blacklist[kw] || [];

          filtered[kw] = products
            .filter((p) => {
              const title = p.title.toLowerCase();
              const hasMatch = expanded.some((variant) =>
                new RegExp(`\\b${variant.toLowerCase()}\\b`, "i").test(title)
              );
              if (!hasMatch) return false;
              if (exclude.some((bad) => title.includes(bad.toLowerCase()))) return false;
              if (include.length > 0) {
                return include.some((good) => title.includes(good.toLowerCase()));
              }
              return true;
            })
            .slice(0, 4);
        });

        setResults(filtered);
      } catch {
        showError("⚠️ Nu s-au putut încărca produsele.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [keywords]);

  // Pentru descriere expandabila la produse
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen dark:bg-[#0b0f19] flex flex-col items-center py-10 transition-colors">
      {/* Mesaje */}
      {errorMsg && (
        <div className="flex items-center justify-center gap-2 bg-red-100 text-red-800 border border-red-300 px-4 py-3 rounded-lg shadow animate-bounce mb-4">
          <FaExclamationTriangle className="text-red-600" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center justify-center gap-2 bg-green-100 text-green-800 border border-green-300 px-4 py-3 rounded-lg shadow animate-fade-in mb-4">
          <FaCheckCircle className="text-green-600" /> {successMsg}
        </div>
      )}

      {/* CARD PRINCIPAL */}
      <div className="w-full max-w-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 relative">
        {/* Header */}
        <div className="py-5 px-8 border-b border-neutral-200 dark:border-neutral-800 bg-transparent flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
              Recomandări AI
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
              Pe baza imaginii încărcate
            </span>
          </div>
          <div className="ml-auto text-xs rounded-full bg-neutral-100 dark:bg-neutral-900 px-3 py-1 font-semibold text-neutral-700 dark:text-neutral-300 shadow">
            {credits} credite disponibile
          </div>
        </div>
        {/* Formular upload + preview */}
        <div className="flex flex-col gap-6 px-6 py-8 items-center max-w-2xl mx-auto w-full">
          <div className="w-full flex flex-col items-center">
            {!preview && (
              <>
                <label
                  htmlFor="upload-image"
                  className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl cursor-pointer hover:border-blue-500 transition bg-white dark:bg-neutral-900"
                >
                  <FaImage size={30} className="text-neutral-400 dark:text-neutral-500 mb-2" />
                  <span className="text-neutral-500 dark:text-neutral-300 text-sm font-medium">
                    Încarcă imagine pentru analiză
                  </span>
                </label>
                <input
                  id="upload-image"
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                  disabled={loading}
                />
              </>
            )}
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="max-h-80 mx-auto mt-3 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 object-contain bg-white dark:bg-neutral-900"
              />
            )}
            <button
              onClick={handleSend}
              disabled={loading || !selectedFile || !session}
              className={`w-full mt-6 flex justify-center items-center gap-2 py-3 rounded-xl font-semibold text-sm shadow-lg transition
                ${
                  !session
                    ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-purple-700 hover:scale-105 text-white"
                }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : !session ? (
                "Trebuie să fii logat pentru a trimite"
              ) : (
                <>
                  <FaSearch /> Trimite imaginea – 2 credite
                </>
              )}
            </button>
          </div>
          {/* Keywords găsite */}
          {preview && !loading && keywords.length > 0 && (
            <div className="text-center text-neutral-500 dark:text-neutral-300 text-sm mt-4">
              🧠 AI a identificat:{" "}
              <span className="font-semibold">{keywords.join(", ")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Rezultate produse */}
      <div className="w-full max-w-7xl mt-10 px-4">
        {!loading &&
          keywords.map((kw) => (
            <div key={kw} className="mt-12">
              <h2 className="text-2xl font-bold text-center mb-6 text-neutral-900 dark:text-white">
                Rezultate pentru:{" "}
                <span className="text-blue-600 dark:text-blue-400">{kw}</span>
              </h2>
              {results[kw]?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {results[kw].map((product, idx) => {
                    const descId = `${kw}-${idx}`;
                    const descShort =
                      product.description && product.description.length > 100
                        ? product.description.slice(0, 100) + "..."
                        : product.description || "Fără descriere";
                    const showExpand =
                      product.description && product.description.length > 100;

                    return (
                      <div
                        key={descId}
                        className="bg-white dark:bg-neutral-900 rounded-2xl shadow-lg border border-neutral-200 dark:border-neutral-800 hover:shadow-xl transition p-5 flex flex-col"
                      >
                        <img
                          src={product.image_urls.split(",")[0]}
                          alt={product.title}
                          className="w-full h-44 object-cover rounded-xl mb-4 cursor-pointer bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                        />
                        <h3 className="font-semibold text-base mb-2 text-center line-clamp-2 text-neutral-900 dark:text-white">
                          {product.title}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-300 text-center flex-1 transition-all duration-200">
                          {expanded[descId] ? product.description : descShort}
                        </p>
                        {showExpand && (
                          <button
                            className="text-xs font-semibold mt-1 mb-2 text-blue-600 dark:text-blue-400 hover:underline transition"
                            onClick={() => toggleExpand(descId)}
                          >
                            {expanded[descId] ? "Ascunde descrierea" : "Vezi descriere completă"}
                          </button>
                        )}
                        <div className="text-blue-600 dark:text-blue-400 font-bold mt-2 text-center">
                          {product.price} {product.currency || "RON"}
                        </div>
                        {product.shop && (
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 text-center">
                            Magazin:{" "}
                            <span className="font-medium">{product.shop}</span>
                          </div>
                        )}
                        {product.url ? (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 py-2 rounded-lg bg-gradient-to-r from-green-600 to-emerald-700 text-white text-sm font-semibold text-center hover:scale-105 transition block"
                          >
                            Vezi produsul
                          </a>
                        ) : (
                          <span className="text-sm text-neutral-400 mt-3 text-center">
                            ❌ Link indisponibil
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-neutral-400 italic text-center">
                  ❌ Niciun produs găsit pentru acest cuvânt.
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
