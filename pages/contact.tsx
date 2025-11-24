// pages/contact.tsx
import Head from "next/head";
import Link from "next/link";
import { useState, ChangeEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send, MessageSquare, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    message: "" 
  });
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (status === "error") {
      setStatus("idle");
      setErrorMessage(null);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    try {
      // Asigură-te că ai endpoint-ul /api/contact creat. 
      // Dacă nu există, va returna 404, dar UI-ul va trata eroarea.
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare la trimitere.');
      }

      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
      
      // Reset status după 5 secunde
      setTimeout(() => setStatus("idle"), 5000);

    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setErrorMessage(error.message || "Nu am putut trimite mesajul. Încearcă din nou.");
    }
  }

  return (
    <>
      <Head>
        <title>Contactează-ne | Randări 3D AI</title>
        <meta
          name="description"
          content="Ai întrebări sau un proiect special? Echipa Randări 3D este aici să te ajute. Scrie-ne și transformăm ideile tale în realitate."
        />
      </Head>

      <main className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Background Ambient Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none translate-y-1/3 -translate-x-1/3" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-start">
            
            {/* Coloana Stânga: Informații */}
            <div className="space-y-10 lg:sticky lg:top-24">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  Hai să discutăm despre <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
                    proiectul tău
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Ai nevoie de randări arhitecturale, animații video sau imagini generate cu AI? 
                  Suntem aici să îți răspundem la orice întrebare și să găsim soluția perfectă pentru tine.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Email</h3>
                    <p className="text-sm text-muted-foreground mb-1">Pentru oferte și colaborări</p>
                    <a href="mailto:contact@randari3d.ro" className="text-primary hover:underline font-medium">
                      contact@randari3d.ro
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Telefon</h3>
                    <p className="text-sm text-muted-foreground mb-1">Luni - Vineri, 09:00 - 18:00</p>
                    <a href="tel:+40700000000" className="text-primary hover:underline font-medium">
                      +40 700 000 000
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-primary/20 transition-colors">
                  <div className="bg-primary/10 p-3 rounded-lg text-primary">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Sediu</h3>
                    <p className="text-muted-foreground">
                      București, România<br />
                      Disponibili global online.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Cauți răspunsuri rapide? Verifică secțiunea noastră de{" "}
                  <Link href="/faq" className="text-primary hover:underline">
                    Întrebări Frecvente
                  </Link>.
                </p>
              </div>
            </div>

            {/* Coloana Dreapta: Formular */}
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 md:p-10 relative overflow-hidden">
              {/* Decorative gradient inside card */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-blue-500" />
              
              <div className="mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-primary" />
                  Trimite-ne un mesaj
                </h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Completează formularul și te vom contacta în cel mai scurt timp posibil.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium ml-1">Numele tău</label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="ex: Andrei Popescu"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="h-12 bg-secondary/30 focus:bg-background transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium ml-1">Email</label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ex: nume@email.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="h-12 bg-secondary/30 focus:bg-background transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="text-sm font-medium ml-1">Telefon <span className="text-muted-foreground font-normal">(Opțional)</span></label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="07xx xxx xxx"
                      value={form.phone}
                      onChange={handleChange}
                      className="h-12 bg-secondary/30 focus:bg-background transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium ml-1">Mesajul tău</label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Salut! Aș dori să aflu mai multe despre..."
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                    className="resize-none bg-secondary/30 focus:bg-background transition-colors p-4"
                  />
                </div>

                {status === "error" && (
                  <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="w-4 h-4" />
                    <p>{errorMessage}</p>
                  </div>
                )}

                {status === "success" && (
                  <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-lg text-sm animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <p>Mesajul a fost trimis cu succes! Te vom contacta curând.</p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full h-14 text-base font-bold tracking-wide shadow-lg hover:shadow-primary/25 transition-all"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading" ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="animate-spin h-5 w-5" />
                      Se trimite...
                    </span>
                  ) : status === "success" ? (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Trimis
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Trimite Mesajul <Send className="w-4 h-4 ml-1" />
                    </span>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-6">
                  Prin trimiterea acestui formular, ești de acord cu{" "}
                  <Link href="/termeni" className="text-primary hover:underline">
                    Termenii și Condițiile
                  </Link>{" "}
                  noastre.
                </p>
              </form>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}