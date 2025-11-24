import { useState } from "react";

export default function VideoFromTextPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!prompt) return;

    setLoading(true);
    setResultUrl("");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/generate-video-text", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setLoading(false);

      if (data?.url) {
        setResultUrl(data.url);
      } else {
        setErrorMsg("A apărut o eroare la generarea videoclipului.");
      }
    } catch {
      setLoading(false);
      setErrorMsg("A apărut o eroare la generarea videoclipului.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Text ➜ Video</h1>

      <div className="bg-gray-800 p-6 rounded-xl shadow max-w-xl mx-auto">
        <label className="block mb-4">
          <span className="text-gray-300">Descriere (prompt):</span>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 text-white"
            placeholder="Ex: a dragon flying over mountains at sunset"
            aria-label="Prompt pentru generarea videoclipului"
          />
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || !prompt}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white disabled:opacity-50 focus:ring-2 focus:ring-blue-400 outline-none"
          aria-label="Generează videoclipul din text"
        >
          {loading ? "Se generează..." : "Generează video"}
        </button>
        {errorMsg && (
          <div
            role="alert"
            aria-live="assertive"
            className="mt-4 bg-red-700 text-white px-4 py-2 rounded"
          >
            {errorMsg}
          </div>
        )}
      </div>

      {resultUrl && (
        <div className="mt-10 text-center">
          <h2 className="text-xl mb-4">Video generat:</h2>
          <video src={resultUrl} controls className="mx-auto rounded max-w-full" aria-label="Previzualizare video generat" />
        </div>
      )}
    </div>
  );
}