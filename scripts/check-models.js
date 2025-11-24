const { VertexAI } = require('@google-cloud/vertexai');

// Configurare
const project = 'leg-cu-forminator';
const location = 'us-central1'; // Vom testa și 'us-east4' dacă aici nu merge

async function listModels() {
  const vertex_ai = new VertexAI({project: project, location: location});
  const modelGarden = vertex_ai.preview.getGenerativeModel({
    model: 'gemini-3-pro-preview', // Doar pentru inițializare
  });

  console.log(`\n🔍 Caut modele disponibile în proiectul: ${project} (${location})...\n`);

  // Încercăm să ghicim prin testare directă, deoarece API-ul de listare e complex
  const candidates = [
    "gemini-3-pro-image-preview",
    "gemini-2.5-flash-image",
    "imagen-3.0-generate-001",
    "image-generation" // legacy
  ];

  for (const modelId of candidates) {
    try {
      const model = vertex_ai.preview.getGenerativeModel({ model: modelId });
      // Facem un ping simplu (fără generare reală, doar inițializare)
      // Dacă nu dă eroare instant la configurare, e un semn bun, dar testul real e la generare.
      console.log(`✅ Model ID POSIBIL: ${modelId}`);
    } catch (e) {
      console.log(`❌ Model ID Invalid: ${modelId}`);
    }
  }
  
  console.log("\n--- TEST DE GENERARE IMAGINE (Testăm accesul real) ---");
  
  // Testăm Gemini 3 Pro Image
  try {
      console.log("Tentativă generare cu: gemini-3-pro-image-preview...");
      const model = vertex_ai.preview.getGenerativeModel({ model: 'gemini-3-pro-image-preview' });
      const resp = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Red square' }] }],
          generationConfig: { responseModalities: ["IMAGE"] }
      });
      console.log("🎉 SUCCESS! Ai acces la Gemini 3 Pro Image!");
  } catch (e) {
      console.log("⚠️ Eroare Gemini 3 Pro Image:", e.message.split(':')[0]);
      if (e.message.includes("404")) console.log("   -> CONCLUZIE: Modelul nu este activat sau nu există în us-central1.");
  }
}

listModels();