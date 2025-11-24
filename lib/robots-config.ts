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
  type: "video" | "image" | "3d";
  inputs: RobotInput[];
}

export const ROBOTS: Record<string, RobotConfig> = {
  "video-image": {
    id: "video-image",
    title: "Imagine ➔ Video (Veo Fast)",
    description: "Animează imaginea rapid folosind Google Veo 3.1 Fast (4-8 secunde).",
    endpoint: "/api/generate-video-image",
    credits: 15, // Mai ieftin pentru versiunea Fast
    type: "video",
    inputs: [
      { 
        name: "image", 
        type: "image", 
        label: "Încarcă imaginea de start", 
        required: true 
      },
      { 
        name: "prompt", 
        type: "text", 
        label: "Descrie mișcarea", 
        placeholder: "Camera face zoom ușor, frunzele se mișcă, atmosferă cinematică...",
        required: true 
      },
      {
        name: "duration",
        type: "select",
        label: "Durată (Limitată de Model)",
        options: [
            { value: "4", label: "4 secunde (Rapid - 15 credite)" },
            { value: "8", label: "8 secunde (Maxim - 25 credite)" }
        ]
      }
    ]
  },
  // Aici vom adăuga pe viitor și robotul pentru Design Interior
};