import { VertexAI } from "@google-cloud/vertexai";

// Inițializăm clientul Vertex AI cu credențialele din .env
const vertexAI = new VertexAI({
  project: process.env.GOOGLE_PROJECT_ID,
  location: process.env.GOOGLE_LOCATION || "us-central1",
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Fix pentru newline în .env
    },
  },
});

// Exportăm modelele gata de folosire
export const imagenModel = vertexAI.preview.getGenerativeModel({
  model: "imagen-3.0-generate-001",
});

// Pentru Veo, folosim endpoint-ul specific (încă nu e complet standardizat în SDK-ul simplu)
export const vertexInstance = vertexAI;