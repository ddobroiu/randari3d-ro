"use client";

import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import Sidebar from "@/components/Sidebar"; // Asigură-te că importul e corect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FaClock, 
  FaExclamationCircle, 
  FaPlayCircle, 
  FaVideo, 
  FaPaintRoller, 
  FaMagic, 
  FaEraser,
  FaDownload,
  FaEdit,
  FaCoins,
  FaReceipt,
  FaUserCog
} from "react-icons/fa";
import { CheckCircle2, Copy } from "lucide-react";

// --- CONFIG ---
const RobotIcons: Record<string, any> = {
  "video": <FaVideo className="text-purple-500" />,
  "design": <FaPaintRoller className="text-blue-500" />,
  "create": <FaMagic className="text-amber-500" />,
  "editor": <FaEraser className="text-pink-500" />,
};

const judeteRO = [
  "Alba","Arad","Argeș","Bacău","Bihor","Bistrița-Năsăud","Botoșani","Brașov","Brăila",
  "Buzău","Caraș-Severin","Cluj","Constanța","Covasna","Dâmbovița","Dolj","Galați",
  "Giurgiu","Gorj","Harghita","Hunedoara","Ialomița","Iași","Ilfov","Maramureș","Mehedinți",
  "Mureș","Neamț","Olt","Prahova","Satu Mare","Sălaj","Sibiu","Suceava","Teleorman","Timiș",
  "Tulcea","Vaslui","Vâlcea","Vrancea","Municipiul București"
];

// --- TYPES ---
type Generation = {
  id: string;
  imageUrl: string;
  prompt: string;
  robot: string;
  createdAt: string;
  status?: string; 
};

type InvoiceHistoryItem = { id: string; prompt: string; robot: string; invoiceLink?: string | null; createdAt: string; };
type BillingInfo = { type: "pf" | "pj"; cui?: string | null; name?: string | null; address?: string | null; city?: string | null; county?: string | null; email: string; };

export default function Dashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // State
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [modalVideo, setModalVideo] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  
  // State Billing
  const [billing, setBilling] = useState<BillingInfo>({ type: "pf", cui: "", name: "", address: "", city: "", county: "", email: "" });
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingSuccess, setBillingSuccess] = useState("");
  
  // Funcții Data Fetching
  const refreshHistory = () => {
    fetch("/api/history-latest")
      .then((res) => res.json())
      .then((data) => {
        // Backend-ul tău returnează array direct sau {history: []}?
        // Adaptăm pentru siguranță:
        if (Array.isArray(data)) setGenerations(data);
        else if (data?.history) setGenerations(data.history);
        else setGenerations([]);
      })
      .catch(err => console.error("Eroare history:", err));
  };

  useEffect(() => {
    if (session?.user) {
      setFullName((session.user as any)?.name || "Utilizator");
      refreshHistory();
      
      // Billing Info
      fetch("/api/billing-info").then((res) => res.json()).then((data) => {
          if (data.billing) setBilling(data.billing);
      });
      
      // Invoices
      fetch("/api/invoice-history").then((res) => res.json()).then((data) => setInvoiceHistory(data || []));
    }
  }, [session]);

  // Polling pentru status 'processing'
  useEffect(() => {
    const processingItems = generations.filter(g => g.status === 'processing');
    if (processingItems.length > 0) {
      const interval = setInterval(() => {
        // Verificăm status doar pentru itemele în procesare
        // (Opțional: poți optimiza făcând un singur request bulk)
        refreshHistory();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [generations]);

  // Actions
  const handleEditImage = (imageUrl: string, robotType: string) => {
    localStorage.setItem("edit_image_temp", imageUrl);
    if (robotType === 'design' || robotType === 'image-decor') router.push('/robots/design');
    else if (robotType === 'editor') router.push('/robots/editor');
    else router.push('/robots/design');
  };

  const handleBillingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingLoading(true); setBillingSuccess("");
    try {
        const res = await fetch("/api/billing-info", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(billing) });
        if (res.ok) setBillingSuccess("Date salvate cu succes!");
    } catch (e) { console.error(e); }
    setBillingLoading(false);
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    // Poti adauga un toast notification aici
  };

  return (
    <>
      <Head><title>Dashboard – Studio AI</title></Head>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0e14] text-slate-900 dark:text-slate-100">
        <Sidebar /> 
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* --- HEADER & STATS --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
                        Bun venit, {fullName}!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Gestionează proiectele tale și setările contului.
                    </p>
                </div>
                
                {/* Stats Card Compact */}
                <div className="flex items-center gap-6 bg-white dark:bg-[#151a23] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <FaCoins className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Credite</p>
                            <p className="text-xl font-bold">{session?.user?.credits || 0}</p>
                        </div>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700"></div>
                    <Button asChild variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                        <Link href="/planuri">Reîncarcă +</Link>
                    </Button>
                </div>
            </div>

            {/* --- TABS PRINCIPALE --- */}
            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="grid w-full md:w-[400px] grid-cols-2 mb-8 bg-slate-200 dark:bg-slate-800">
                    <TabsTrigger value="projects">Proiectele Mele</TabsTrigger>
                    <TabsTrigger value="settings">Facturare & Setări</TabsTrigger>
                </TabsList>

                {/* --- TAB 1: PROIECTE (GRID) --- */}
                <TabsContent value="projects" className="space-y-6">
                    {generations.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#151a23] rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                            <FaMagic className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium">Nu ai creat niciun proiect încă</h3>
                            <p className="text-slate-500 mb-6">Folosește creditele pentru a genera prima ta randare.</p>
                            <div className="flex justify-center gap-4">
                                <Button asChild variant="outline"><Link href="/robots/create">Generează Imagine</Link></Button>
                                <Button asChild><Link href="/robots/video">Creează Video</Link></Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {generations.map((gen) => {
                                const isVideo = gen.imageUrl.startsWith("data:video") || gen.robot.includes("video") || gen.imageUrl.endsWith(".mp4");
                                
                                return (
                                    <div key={gen.id} className="group bg-white dark:bg-[#151a23] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col">
                                        {/* Media Content */}
                                        <div 
                                            className="relative aspect-square cursor-pointer bg-slate-100 dark:bg-slate-900 overflow-hidden"
                                            onClick={() => {
                                                if (gen.status === "processing" || gen.status === "failed") return;
                                                isVideo ? setModalVideo(gen.imageUrl) : setModalImage(gen.imageUrl);
                                            }}
                                        >
                                            {gen.status === "processing" ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
                                                    <FaClock className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                                                    <span className="text-xs font-bold text-blue-600 animate-pulse">Generare...</span>
                                                </div>
                                            ) : gen.status === "failed" ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 dark:bg-red-900/50 z-10">
                                                    <FaExclamationCircle className="w-8 h-8 text-red-500 mb-2" />
                                                    <span className="text-xs font-bold text-red-500">Eroare</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {isVideo ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-black">
                                                            <video src={gen.imageUrl} className="w-full h-full object-cover opacity-80" />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <FaPlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <img src={gen.imageUrl} alt="Result" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                    )}
                                                    
                                                    {/* Hover Overlay */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <div className="flex gap-2 justify-end">
                                                            <a href={gen.imageUrl} download onClick={(e) => e.stopPropagation()} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition">
                                                                <FaDownload className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Info Content */}
                                        <div className="p-4 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                                                    {RobotIcons[gen.robot] || <FaMagic />}
                                                    <span>{gen.robot}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">
                                                    {new Date(gen.createdAt).toLocaleDateString("ro-RO")}
                                                </span>
                                            </div>
                                            
                                            <div className="relative group/text mb-4 flex-1">
                                                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={gen.prompt}>
                                                    {gen.prompt}
                                                </p>
                                                <button 
                                                    onClick={() => copyPrompt(gen.prompt)}
                                                    className="absolute top-0 right-0 p-1 bg-background shadow-sm border rounded opacity-0 group-hover/text:opacity-100 transition text-xs"
                                                    title="Copiază Prompt"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {!isVideo && gen.status === 'completed' && (
                                                <Button 
                                                    variant="secondary" 
                                                    size="sm" 
                                                    className="w-full mt-auto"
                                                    onClick={() => handleEditImage(gen.imageUrl, gen.robot)}
                                                >
                                                    <FaEdit className="mr-2 w-3 h-3" /> Editează
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* --- TAB 2: SETĂRI & FACTURARE --- */}
                <TabsContent value="settings">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* Card Date Facturare */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FaUserCog className="text-blue-500"/> Date Facturare</CardTitle>
                                <CardDescription>Folosite pentru generarea automată a facturilor (Oblio).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBillingSave} className="space-y-4">
                                    <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
                                        <button type="button" onClick={() => setBilling({...billing, type: "pf"})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing.type === "pf" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"}`}>Persoană Fizică</button>
                                        <button type="button" onClick={() => setBilling({...billing, type: "pj"})} className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${billing.type === "pj" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-500"}`}>Companie (PJ)</button>
                                    </div>

                                    {billing.type === "pj" ? (
                                        <div className="space-y-3">
                                            <div className="grid gap-1">
                                                <label className="text-xs font-medium">CUI Companie</label>
                                                <Input placeholder="RO123456" value={billing.cui||""} onChange={e=>setBilling({...billing, cui:e.target.value})} required/>
                                            </div>
                                            <div className="grid gap-1">
                                                <label className="text-xs font-medium">Nume Companie</label>
                                                <Input placeholder="Nume SRL" value={billing.name||""} onChange={e=>setBilling({...billing, name:e.target.value})} required/>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium">Nume Complet</label>
                                            <Input placeholder="Ion Popescu" value={billing.name||""} onChange={e=>setBilling({...billing, name:e.target.value})} required/>
                                        </div>
                                    )}

                                    <div className="grid gap-1">
                                        <label className="text-xs font-medium">Adresă</label>
                                        <Input placeholder="Str. Exemplului, Nr. 1" value={billing.address||""} onChange={e=>setBilling({...billing, address:e.target.value})} required/>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium">Oraș</label>
                                            <Input placeholder="București" value={billing.city||""} onChange={e=>setBilling({...billing, city:e.target.value})} required/>
                                        </div>
                                        <div className="grid gap-1">
                                            <label className="text-xs font-medium">Județ</label>
                                            <select 
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" 
                                                value={billing.county||""} 
                                                onChange={e=>setBilling({...billing, county:e.target.value})}
                                            >
                                                <option value="">Alege Județ</option>
                                                {judeteRO.map(j=><option key={j} value={j}>{j}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="grid gap-1">
                                        <label className="text-xs font-medium">Email Facturare</label>
                                        <Input type="email" value={billing.email||""} onChange={e=>setBilling({...billing, email:e.target.value})} required/>
                                    </div>

                                    <div className="pt-2">
                                        <Button type="submit" disabled={billingLoading} className="w-full">
                                            {billingLoading ? "Se salvează..." : "Salvează Modificările"}
                                        </Button>
                                        {billingSuccess && (
                                            <p className="text-green-600 text-sm mt-2 flex items-center gap-2">
                                                <CheckCircle2 className="w-4 h-4"/> {billingSuccess}
                                            </p>
                                        )}
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Card Istoric Facturi */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><FaReceipt className="text-purple-500"/> Istoric Facturi</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {invoiceHistory.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">Nu există facturi emise recent.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                        {invoiceHistory.map((inv) => (
                                            <div key={inv.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Alimentare Credite</p>
                                                    <p className="text-xs text-slate-500">{new Date(inv.createdAt).toLocaleDateString("ro-RO")}</p>
                                                </div>
                                                {inv.invoiceLink ? (
                                                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                                                        <a href={inv.invoiceLink} target="_blank" rel="noopener noreferrer">
                                                            <FaDownload className="mr-2 w-3 h-3" /> PDF
                                                        </a>
                                                    </Button>
                                                ) : (
                                                    <span className="text-xs text-amber-500 font-medium">Se procesează</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

          </div>
        </main>

        {/* --- MODALE --- */}
        {modalImage && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModalImage(null)}>
            <img src={modalImage} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in fade-in zoom-in duration-300"/>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"><FaExclamationCircle className="w-8 h-8 rotate-45" /></button>
          </div>
        )}
        {modalVideo && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setModalVideo(null)}>
            <div className="w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300" onClick={e=>e.stopPropagation()}>
                <video src={modalVideo} controls autoPlay className="w-full h-auto max-h-[85vh]"/>
            </div>
            <button className="absolute top-4 right-4 text-white hover:text-gray-300 p-2" onClick={() => setModalVideo(null)}><FaExclamationCircle className="w-8 h-8 rotate-45" /></button>
          </div>
        )}
      </div>
    </>
  );
}