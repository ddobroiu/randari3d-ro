import { useState } from "react";
import Head from "next/head";
// Layout is provided by pages/_app.tsx, do not wrap pages again to avoid duplicates
import { FaCamera, FaSearch, FaShoppingCart, FaMagic } from "react-icons/fa";

// Tipuri pentru date
type AnalysisItem = {
  name: string;
  query: string;
};

type Product = {
  id: string;
  title: string;
  price: string;
  image: string;
  link: string;
};

export default function RecomandarePage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisItem[]>([]);
  const [products, setProducts] = useState<Record<string, Product[]>>({}); // Produse grupate pe query

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      setSelectedImage(URL.createObjectURL(f));
      setAnalysis([]);
      setProducts({});
    }
  };

  const analyzeImage = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("image", file);

      // 1. Trimitem la Gemini pentru analiză
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Eroare la analiză");

      const items = data.analysis.items as AnalysisItem[];
      setAnalysis(items);

      // 2. Căutăm produse pentru fiecare item găsit (în paralel)
      const newProducts: Record<string, Product[]> = {};
      
      await Promise.all(items.map(async (item) => {
        // Aici apelăm API-ul tău de feed.ts cu query-ul generat de AI
        // Presupunem că api/feed acceptă ?q=...
        try {
            const feedRes = await fetch(`/api/feed?q=${encodeURIComponent(item.query)}&limit=4`);
            const feedData = await feedRes.json();
            if (feedData.products && feedData.products.length > 0) {
                newProducts[item.name] = feedData.products;
            }
        } catch (e) {
            console.error("Nu am găsit produse pentru:", item.query);
        }
      }));

      setProducts(newProducts);

    } catch (error) {
      console.error(error);
      alert("Eroare la analiza imaginii.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Găsește mobila din poză - AI Shop the Look</title>
      </Head>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
            Shop the Look cu Google AI
          </h1>
          <p className="text-slate-500 text-lg">
            Ai văzut o cameră care îți place? Încarcă poza și AI-ul îți găsește produsele similare în magazin.
          </p>
        </div>

        {/* ZONA DE UPLOAD */}
        <div className="bg-white dark:bg-[#151a23] rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 text-center">
          
          {!selectedImage ? (
            <label className="cursor-pointer flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
              <FaCamera className="text-5xl text-slate-400 mb-4" />
              <span className="text-lg font-semibold text-slate-600 dark:text-slate-300">Apasă pentru a încărca poza</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Imaginea Încărcată */}
              <div className="w-full md:w-1/2">
                <img src={selectedImage} alt="Preview" className="w-full rounded-xl shadow-lg mb-4 object-cover max-h-[500px]" />
                <button 
                    onClick={() => { setSelectedImage(null); setFile(null); }}
                    className="text-sm text-red-500 hover:underline"
                >
                    Șterge și încarcă alta
                </button>
              </div>

              {/* Butonul de Acțiune sau Rezultatele */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center h-full">
                {analysis.length === 0 && !loading && (
                    <div className="my-auto">
                        <h3 className="text-xl font-bold mb-4">Gata de analiză?</h3>
                        <button 
                            onClick={analyzeImage}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold shadow-lg flex items-center gap-2 transition transform hover:scale-105"
                        >
                            <FaMagic /> Identifică Produsele
                        </button>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                        <p className="text-lg font-semibold animate-pulse">Google Gemini scanează imaginea...</p>
                        <p className="text-sm text-slate-500">Identificăm mobila și căutăm prețuri.</p>
                    </div>
                )}

                {/* REZULTATE - LISTA DE OBIECTE GĂSITE */}
                {!loading && analysis.length > 0 && (
                    <div className="w-full text-left space-y-6">
                        <h3 className="text-xl font-bold border-b pb-2">Obiecte Identificate:</h3>
                        
                        {analysis.map((item, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl">
                                <div className="flex justify-between items-center mb-3">
                                    <div>
                                        <p className="font-bold text-lg capitalize">{item.name}</p>
                                        <p className="text-xs text-slate-500">Căutare: "{item.query}"</p>
                                    </div>
                                </div>

                                {/* Produse Găsite pentru acest obiect */}
                                {products[item.name] && products[item.name].length > 0 ? (
                                    <div className="grid grid-cols-2 gap-3">
                                        {products[item.name].map((prod) => (
                                            <a key={prod.id} href={prod.link} target="_blank" rel="noreferrer" className="block group">
                                                <div className="bg-white dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-md transition">
                                                    <div className="h-32 overflow-hidden">
                                                        <img src={prod.image} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                                                    </div>
                                                    <div className="p-2">
                                                        <p className="text-sm font-medium line-clamp-2">{prod.title}</p>
                                                        <div className="flex justify-between items-center mt-2">
                                                            <span className="text-blue-600 font-bold text-sm">{prod.price} Lei</span>
                                                            <FaShoppingCart className="text-slate-400 group-hover:text-blue-500" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400 italic">Nu am găsit produse exacte în feed.</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}