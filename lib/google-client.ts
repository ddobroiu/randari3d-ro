import { GoogleAuth } from "google-auth-library";

// Curățăm cheia privată pentru a fi siguri că newline-urile sunt interpretate corect
const privateKey = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

const auth = new GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: privateKey,
    project_id: process.env.GOOGLE_PROJECT_ID,
  },
  // Cerem acces complet la Cloud Platform pentru a folosi Vertex AI
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

export async function getGoogleToken() {
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}

export const projectId = process.env.GOOGLE_PROJECT_ID;
export const location = process.env.GOOGLE_LOCATION || "us-central1"; // Default location
