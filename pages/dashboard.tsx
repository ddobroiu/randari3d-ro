"use client";

import { useSession, signOut } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import Link from "next/link"; // Import Link pentru navigare rapidă
import Layout from "../components/Layout"; // Asigură-te că Layout include Sidebar-ul nou
import Sidebar from "../components/Sidebar"; // Importăm Sidebar-ul explicit dacă Layout nu îl are hardcodat
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FaClock, 
  FaExclamationCircle, 
  FaPlayCircle, 
  FaVideo, 
  FaPaintRoller, 
  FaMagic, 
  FaEraser 
} from "react-icons/fa";

// Iconițe pentru roboți
const RobotIcons: Record<string, any> = {
  "video": <FaVideo />,
  "design": <FaPaintRoller />,
  "create": <FaMagic />,
  "editor": <FaEraser />,
  "video-image": <FaVideo />, // Compatibilitate cu intrările vechi
  "image-decor": <FaPaintRoller />
};

const judeteRO = [
  "Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov","Brăila",
  "Buzău","Caraș-Severin","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați",
  "Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți",
  "Mureș","Neamț","Olt","Prahova","Satu Mare","Sălaj","Sibiu","Suceava","Teleorman","Timiș",
  "Tulcea","Vaslui","Vâlcea","Vrancea","Municipiul București"
];

type Generation = {
  id: string;
  imageUrl: string;
  prompt: string;
  robot: string;
  createdAt: string;
  status?: string; 
  operationId?: string;
};

type Referral = { id: string; email: string; createdAt: string; };
type InvoiceHistoryItem = { id: string; prompt: string; robot: string; invoiceLink?: string | null; createdAt: string; };
type BillingInfo = { type: "pf" | "pj"; cui?: string | null; name?: string | null; address?: string | null; city?: string | null; county?: string | null; email: string; };

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalVideo, setModalVideo] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  const [billing, setBilling] = useState<BillingInfo>({ type: "pf", cui: "", name: "", address: "", city: "", county: "", email: "" });
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState("");
  const [billingError, setBillingError] = useState("");
  const [showBillingForm, setShowBillingForm] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const refreshHistory = () => {
    fetch("/api/history-latest")
      .then((res) => res.json())
      .then((data) => setGenerations(data?.history || [])); // Asigură-te că API returnează { history: [...] } sau adaptează
  };

  useEffect(() => {
    if (session?.user) {
      setFullName((session.user as any)?.name || "");
      refreshHistory();
      
      fetch("/api/my-referrals").then((res) => res.json()).then((data) => setReferrals(data || []));
      fetch("/api/billing-info").then((res) => res.json()).then((data) => {
          if (data.billing) {
            setBilling(data.billing);
            if (data.billing.type) setShowBillingForm(true);
          }
        });
      fetch("/api/invoice-history").then((res) => res.json()).then((data) => setInvoiceHistory(data || []));
    }
  }, [session]);

  // --- Polling Logic ---
  useEffect(() => {
    const processingItems = generations.filter(g => g.status === 'processing');
    if (processingItems.length > 0) {
      const interval = setInterval(() => {
        processingItems.forEach(async (item) => {
          try {
            const res = await fetch("/api/robots/check-status", { // Folosim noul path organizat
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ historyId: item.id })
            });
            const data = await res.json();
            if (data.status === "completed" || data.status === "failed") refreshHistory(); 
          } catch (e) { console.error(e); }
        });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [generations]);

  const handleBillingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingLoading(true); setBillingSuccess(""); setBillingError("");
    const res = await fetch("/api/billing-info", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(billing) });
    const data = await res.json();
    if (!res.ok) setBillingError(data.error || "Eroare.");
    else setBillingSuccess("Salvat!");
    setBillingLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return setPasswordError("Parolele nu coincid.");
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ current: currentPassword, newpass: newPassword }),
    });
    if (res.ok) {
        setPasswordSuccess("Parolă schimbată!"); 
        setShowPasswordForm(false);
    } else {
        setPasswordError("Eroare.");
    }
  };

  const referralLink = session?.user?.id ? `https://randari3d.ro/register?ref=${session.user.id}` : "";

  return (
    <>
      <Head><title>Dashboard – Randări 3D</title></Head>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-white">
        {/* Sidebar inclus direct aici pentru layout fix */}
        <Sidebar /> 
        
        <main className="flex-1 p-8 overflow-y-auto max-h-screen">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coloana Stânga: User Info */}
            <div className="space-y-6">
              {/* Card User */}
              <div className="bg-white dark:bg-[#151a23] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-[#23263a]">
                <h2 className="text-xl font-bold mb-2">Salut, {fullName}!</h2>
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl mb-4">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Credite Disponibile</span>
                    <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{session?.user?.credits || 0}</span>
                </div>
                <Link href="/planuri" className="block w-full py-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:opacity-90 transition">
                    Cumpără Credite
                </Link>
              </div>

              {/* Card Facturare */}
              <div className="bg-white dark:bg-[#151a23] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-[#23263a]">
                <h3 className="font-bold mb-4">Date Facturare (Oblio)</h3>
                <div className="flex gap-4 mb-4 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" checked={billing.type === "pf"} onChange={() => {setBilling(b=>({...b, type:"pf"})); setShowBillingForm(true)}}/> Fizică</label>
                  <label className="flex items-center gap-2"><input type="radio" checked={billing.type === "pj"} onChange={() => {setBilling(b=>({...b, type:"pj"})); setShowBillingForm(true)}}/> Juridică</label>
                </div>
                {showBillingForm && (
                  <form onSubmit={handleBillingSave} className="space-y-3">
                    {billing.type === "pj" ? (
                      <Input placeholder="CUI" value={billing.cui||""} onChange={e=>setBilling({...billing, cui:e.target.value})} required/>
                    ) : (
                      <>
                        <Input placeholder="Nume" value={billing.name||""} onChange={e=>setBilling({...billing, name:e.target.value})} required/>
                        <Input placeholder="Adresă" value={billing.address||""} onChange={e=>setBilling({...billing, address:e.target.value})} required/>
                        <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Oraș" value={billing.city||""} onChange={e=>setBilling({...billing, city:e.target.value})} required/>
                            <select className="border rounded-md bg-transparent text-sm px-2" value={billing.county||""} onChange={e=>setBilling({...billing, county:e.target.value})}>
                                <option value="">Județ</option>
                                {judeteRO.map(j=><option key={j} value={j}>{j}</option>)}
                            </select>
                        </div>
                        <Input placeholder="Email" value={billing.email||""} onChange={e=>setBilling({...billing, email:e.target.value})} required/>
                      </>
                    )}
                    <Button disabled={billingLoading} className="w-full">{billingLoading ? "..." : "Salvează"}</Button>
                    {billingSuccess && <p className="text-green-500 text-xs">{billingSuccess}</p>}
                  </form>
                )}
              </div>
            </div>

            {/* Coloana Dreapta: Conținut Principal */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Istoric Generări */}
              <div className="bg-white dark:bg-[#151a23] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-[#23263a]">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Istoric Creații
                </h2>
                {generations.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <p>Nu ai creat nimic încă.</p>
                    <Link href="/robots/video" className="text-blue-500 hover:underline">Începe cu un Video!</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {generations.map((gen) => (
                      <div key={gen.id} className="group relative rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer"
                           onClick={() => {
                             if (gen.status === "processing" || gen.status === "failed") return;
                             if (gen.robot.includes("video") || gen.imageUrl.endsWith(".mp4")) setModalVideo(gen.imageUrl);
                             else setModalImage(gen.imageUrl);
                           }}
                      >
                        {/* Zona Media */}
                        <div className="aspect-video w-full relative">
                            {gen.status === "processing" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 animate-pulse">
                                    <FaClock className="text-2xl text-blue-500 mb-2 animate-spin-slow"/>
                                    <span className="text-xs font-bold text-blue-600">Se lucrează...</span>
                                </div>
                            ) : gen.status === "failed" ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-900/20">
                                    <FaExclamationCircle className="text-2xl text-red-500 mb-1"/>
                                    <span className="text-xs font-bold text-red-500">Eșuat</span>
                                </div>
                            ) : (
                                <>
                                    {(gen.robot.includes("video") || gen.imageUrl.endsWith(".mp4") || gen.imageUrl.startsWith("data:video")) ? (
                                        <div className="w-full h-full bg-black flex items-center justify-center relative">
                                            <video src={gen.imageUrl} className="w-full h-full object-cover opacity-90" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                                                <FaPlayCircle className="text-4xl text-white opacity-90 group-hover:scale-110 transition" />
                                            </div>
                                        </div>
                                    ) : (
                                        <img src={gen.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                    )}
                                </>
                            )}
                        </div>

                        {/* Detalii */}
                        <div className="p-3">
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-1 text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                                    {RobotIcons[gen.robot] || <FaMagic />}
                                    <span>{gen.robot}</span>
                                </div>
                                <span className="text-[10px] text-slate-400">{new Date(gen.createdAt).toLocaleDateString("ro-RO")}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300 truncate" title={gen.prompt}>{gen.prompt}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Istoric Facturi */}
              {invoiceHistory.length > 0 && (
                <div className="bg-white dark:bg-[#151a23] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-[#23263a]">
                  <h2 className="text-lg font-bold mb-4">Facturi Recente</h2>
                  <div className="space-y-2">
                    {invoiceHistory.map((inv) => (
                      <div key={inv.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{inv.prompt}</p>
                          <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                        </div>
                        {inv.invoiceLink ? (
                            <a href={inv.invoiceLink} target="_blank" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200">Descarcă</a>
                        ) : <span className="text-xs text-slate-400">Indisponibil</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>

        {/* Modale */}
        {modalImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setModalImage(null)}>
            <img src={modalImage} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"/>
          </div>
        )}
        {modalVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setModalVideo(null)}>
            <div className="w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl" onClick={e=>e.stopPropagation()}>
                <video src={modalVideo} controls autoPlay className="w-full h-auto max-h-[80vh]"/>
                <div className="p-2 flex justify-end bg-[#151a23]">
                    <Button variant="ghost" onClick={() => setModalVideo(null)}>Închide</Button>
                </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}