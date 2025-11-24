// lib/robots-config.ts

export type RobotInputType = "image" | "text" | "select";

export interface RobotInput {
  name: string;
  type: RobotInputType;
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface RobotConfig {
  id: string;
  title: string;
  description: string;
  endpoint: string;
  credits: number;
  type: "video" | "image";
  inputs: RobotInput[];
}

export const ROBOTS: Record<string, RobotConfig> = {
  // 1. STUDIO VIDEO (Google Veo)
  "video": {
    id: "video",
    title: "Studio Video (Veo)",
    description: "Transformă imagini statice în videoclipuri cinematice cu Google Veo 3.1 Fast.",
    endpoint: "/api/robots/video",
    credits: 25,
    type: "video",
    inputs: [
      { name: "image", type: "image", label: "Imagine de start", required: true },
      { name: "prompt", type: "text", label: "Descrie mișcarea", placeholder: "Zoom lent, atmosferă cinematică, vânt în copaci...", required: true },
      { name: "duration", type: "select", label: "Durată", options: [{value:"4", label:"4 secunde (Rapid)"}, {value:"8", label:"8 secunde (Maxim)"}] }
    ]
  },

  // 2. STUDIO DESIGN (Google Gemini)
  "design": {
    id: "design",
    title: "Studio Design Interior (Gemini)",
    description: "Reamenajează orice cameră folosind puterea Gemini. Încarcă o poză și alege un stil nou.",
    endpoint: "/api/robots/design",
    credits: 10,
    type: "image",
    inputs: [
      { name: "image", type: "image", label: "Poza camerei actuale", required: true },
      { 
        name: "style", 
        type: "select", 
        label: "Stil Design", 
        options: [
            { value: "modern minimalist luxury interior, 8k", label: "Modern Minimalist" },
            { value: "scandinavian style, bright, wood textures", label: "Scandinav" },
            { value: "industrial loft style, exposed brick, dark tones", label: "Industrial Loft" },
            { value: "classic luxury, victorian details, warm light", label: "Clasic Lux" },
            { value: "cyberpunk futuristic room, neon lighting", label: "Futurist" }
        ]
      },
      { name: "prompt", type: "text", label: "Instrucțiuni Extra", placeholder: "Adaugă plante, schimbă podeaua...", required: false }
    ]
  },

  // 3. STUDIO CREAȚIE (Google Gemini)
  "create": {
    id: "create",
    title: "Studio Creație (Gemini)",
    description: "Generează imagini de la zero, texturi sau fundaluri folosind Gemini AI.",
    endpoint: "/api/robots/create",
    credits: 5,
    type: "image",
    inputs: [
      { name: "prompt", type: "text", label: "Ce vrei să creezi?", placeholder: "O textură de marmură albă cu venaturi aurii...", required: true },
      { 
        name: "aspect", 
        type: "select", 
        label: "Format", 
        options: [
            { value: "1:1", label: "Pătrat (1:1)" },
            { value: "16:9", label: "Landscape (16:9)" },
            { value: "9:16", label: "Portrait (9:16)" }
        ]
      }
    ]
  },

  // 4. STUDIO EDITOR (Google Gemini)
  "editor": {
    id: "editor",
    title: "Studio Editor Foto (Gemini)",
    description: "Modifică elemente din poză sau înlocuiește obiecte folosind instrucțiuni text cu Gemini AI.",
    endpoint: "/api/robots/editor",
    credits: 10,
    type: "image",
    inputs: [
      { name: "image", type: "image", label: "Imaginea de modificat", required: true },
      { name: "prompt", type: "text", label: "Ce să modificăm?", placeholder: "Schimbă cerul în apus / Scoate mașina din fundal...", required: true }
    ]
  }
};