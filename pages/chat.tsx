import { useState, useRef, useEffect } from "react";
import Head from "next/head";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Eroare chat");

      const assistantMsg: Message = { role: "assistant", content: data.reply || "" };
      setMessages((m) => [...m, assistantMsg]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Eroare la comunicarea cu AI: " + String(e?.message || e) }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <Head>
        <title>Chat AI - Gemini</title>
      </Head>

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Chat AI (Gemini)</h1>

        <div className="border rounded-lg overflow-hidden shadow-sm">
          <div className="h-[60vh] overflow-y-auto p-4 bg-white dark:bg-[#0b0e14]">
            {messages.length === 0 && (
              <p className="text-slate-500">Scrie ce vrei să întrebi modelului.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mb-4 ${m.role === "user" ? "text-right" : "text-left"}`}>
                <div className={`inline-block p-3 rounded-lg ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"}`}>
                  {m.content}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="p-4 bg-slate-50 dark:bg-[#071018] flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Scrie mesaj..."
              className="flex-1 rounded-md border px-3 py-2 bg-white dark:bg-[#0b1116]"
              disabled={loading}
            />
            <button onClick={send} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              {loading ? "Trimit..." : "Trimite"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
