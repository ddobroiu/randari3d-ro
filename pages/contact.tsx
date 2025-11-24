// pages/contact.tsx

import Head from "next/head";
import { useState } from "react";
import { Mail } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mesaj trimis! (funcționalitate demo)");
  };

  return (
    <>
      <Head>
        <title>Contact | Randări 3D AI</title>
      </Head>

      <main className="min-h-screen bg-background text-foreground px-4 py-12 font-sans transition-colors">
        <div className="max-w-2xl mx-auto bg-card text-card-foreground p-8 rounded-2xl shadow-xl border border-border space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Mail className="w-6 h-6" />
            <h1 className="text-2xl font-semibold">Contactează-ne</h1>
          </div>

          <p className="text-muted-foreground text-center text-sm">
            Pentru întrebări, sugestii sau probleme tehnice, scrie-ne la{" "}
            <a href="mailto:support@randari3d.ro" className="text-primary underline">
              support@randari3d.ro
            </a>{" "}
            sau folosește formularul de mai jos.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Nume complet"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-input border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            <input
              type="email"
              name="email"
              placeholder="Adresa de email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-input border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            <textarea
              name="message"
              placeholder="Mesajul tău"
              rows={5}
              required
              value={form.message}
              onChange={handleChange}
              className="w-full p-3 rounded-lg bg-input border border-border placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition"
            ></textarea>
            <button
              type="submit"
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Trimite mesajul
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
