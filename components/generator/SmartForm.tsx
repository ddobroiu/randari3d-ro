import React, { useState, useEffect, useRef } from "react";
import { FaImage, FaMagic } from "react-icons/fa";
import { RobotConfig } from "@/lib/robots-config";

interface SmartFormProps {
  config: RobotConfig;
  loading: boolean;
  onSubmit: (formData: FormData, filePreview: string | null) => void;
  initialImage?: string | null; // --- NOU: Acceptăm imagine de start ---
}

export default function SmartForm({ config, loading, onSubmit, initialImage }: SmartFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- NOU: Încărcăm imaginea inițială dacă există (Chain Editing) ---
  useEffect(() => {
    if (initialImage) {
        setPreview(initialImage);
        // Convertim URL-ul/Base64 în obiect File pentru formular
        fetch(initialImage)
            .then(res => res.blob())
            .then(blob => {
                const f = new File([blob], "initial-image.png", { type: blob.type });
                setFile(f);
            })
            .catch(err => console.error("Nu am putut încărca imaginea inițială:", err));
    }
  }, [initialImage]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!file && config.inputs.some(i => i.type === 'image')) {
        alert("Te rugăm să alegi o imagine!");
        return;
    }

    const formData = new FormData(e.currentTarget);
    // Dacă avem un fișier setat manual (prin drag&drop sau initialImage), îl punem în FormData
    if (file) {
        formData.set("image", file);
    }
    
    onSubmit(formData, preview);
  };

  const glass = "bg-white/80 dark:bg-[#151a23]/70 backdrop-blur-xl";
  const border = "border border-slate-200 dark:border-[#23263a]";

  return (
    <form
      onSubmit={handleSubmit}
      className={`${glass} ${border} rounded-2xl p-8 shadow-2xl flex flex-col gap-6 h-fit`}
    >
      <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-blue-400 via-purple-400 to-purple-700 bg-clip-text text-transparent">
        {config.title}
      </h1>
      <p className="text-center text-slate-500 text-sm">{config.description}</p>

      {config.inputs.map((input) => (
        <div key={input.name} className="space-y-2">
          <label className="font-semibold text-sm ml-1">{input.label}</label>
          
          {input.type === "image" && (
            <label className={`flex flex-col items-center justify-center h-48 w-full border-2 border-dashed border-slate-300 dark:border-[#37405a] rounded-xl cursor-pointer hover:border-blue-500 transition relative bg-slate-50/50 dark:bg-[#161b27]/40 overflow-hidden group`}>
              {!preview ? (
                <>
                  <FaImage size={34} className="text-slate-400 mb-2 group-hover:scale-110 transition" />
                  <span className="text-xs text-slate-500">Click sau trage o imagine aici</span>
                </>
              ) : (
                <>
                    <img src={preview} className="w-full h-full object-contain z-10" alt="Preview" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                        <p className="text-white font-bold">Schimbă Imaginea</p>
                    </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                name={input.name}
                accept="image/*"
                className="hidden"
                // Nu mai e required html dacă avem deja file în state
                required={!file && input.required}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setFile(f);
                    setPreview(URL.createObjectURL(f));
                  }
                }}
              />
            </label>
          )}

          {input.type === "text" && (
             <textarea
               name={input.name}
               placeholder={input.placeholder}
               required={input.required}
               className="w-full bg-white dark:bg-[#0f1219] border border-slate-300 dark:border-[#37405a] rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none min-h-[100px]"
             />
          )}

          {input.type === "select" && (
            <select 
                name={input.name}
                className="w-full bg-white dark:bg-[#0f1219] border border-slate-300 dark:border-[#37405a] rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none"
            >
                {input.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
            <span className="animate-pulse">Se procesează...</span>
        ) : (
            <><FaMagic /> Generează ({config.credits} credite)</>
        )}
      </button>
    </form>
  );
}