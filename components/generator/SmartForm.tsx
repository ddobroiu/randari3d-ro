// components/generator/SmartForm.tsx
import React, { useState } from "react";
import { FaImage, FaMagic } from "react-icons/fa";
import { RobotConfig } from "@/lib/robots-config";

interface SmartFormProps {
  config: RobotConfig;
  loading: boolean;
  onSubmit: (formData: FormData, filePreview: string | null) => void;
}

export default function SmartForm({ config, loading, onSubmit }: SmartFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
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
            <label className={`flex flex-col items-center justify-center h-32 w-full border-2 border-dashed border-slate-300 dark:border-[#37405a] rounded-xl cursor-pointer hover:border-blue-500 transition relative bg-slate-50/50 dark:bg-[#161b27]/40 overflow-hidden`}>
              {!preview ? (
                <>
                  <FaImage size={24} className="text-slate-400 mb-2" />
                  <span className="text-xs text-slate-500">Click pentru upload</span>
                </>
              ) : (
                <img src={preview} className="w-full h-full object-cover" alt="Preview" />
              )}
              <input
                type="file"
                name={input.name}
                accept="image/*"
                className="hidden"
                required={input.required}
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
               className="w-full bg-transparent border border-slate-300 dark:border-[#37405a] rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none min-h-[80px]"
             />
          )}

          {input.type === "select" && (
            <select 
                name={input.name}
                className="w-full bg-transparent border border-slate-300 dark:border-[#37405a] rounded-xl p-3"
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
        className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold shadow-lg hover:scale-[1.02] transition disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
      >
        {loading ? "Se generează..." : <><FaMagic /> Generează ({config.credits} credite)</>}
      </button>
    </form>
  );
}