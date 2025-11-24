"use client";

import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

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
};

type Referral = {
  id: string;
  email: string;
  createdAt: string;
};

type BillingInfo = {
  type: "pf" | "pj";
  cui?: string | null;
  name?: string | null;
  address?: string | null;
  city?: string | null;
  county?: string | null;
  email: string;
};

type InvoiceHistoryItem = {
  id: string;
  prompt: string;
  robot: string;
  invoiceLink?: string | null;
  createdAt: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<InvoiceHistoryItem[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");

  const [billing, setBilling] = useState<BillingInfo>({
    type: "pf",
    cui: "",
    name: "",
    address: "",
    city: "",
    county: "",
    email: "",
  });
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

  useEffect(() => {
    if (session?.user) {
      setFullName((session.user as any)?.name || "");
      fetch("/api/history-latest")
        .then((res) => res.json())
        .then((data) => setGenerations(data || []));
      fetch("/api/my-referrals")
        .then((res) => res.json())
        .then((data) => setReferrals(data || []));
      fetch("/api/billing-info")
        .then((res) => res.json())
        .then((data) => {
          if (data.billing) {
            setBilling(data.billing);
            if (data.billing.type === "pf" || data.billing.type === "pj") {
              setShowBillingForm(true);
            }
          }
        });
      fetch("/api/invoice-history")
        .then((res) => res.json())
        .then((data) => setInvoiceHistory(data || []));
    }
  }, [session]);

  const referralLink = session?.user?.id
    ? `https://randari3d.ro/register?ref=${session.user.id}`
    : "";

  const handleBillingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBillingSuccess("");
    setBillingError("");
    setBillingLoading(true);
    const res = await fetch("/api/billing-info", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(billing),
    });
    const data = await res.json();
    if (!res.ok) {
      setBillingError(data.error || "Eroare la salvare.");
    } else {
      setBillingSuccess("Datele au fost salvate!");
    }
    setBillingLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setPasswordError("Completează toate câmpurile");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Noua parolă trebuie să aibă minim 6 caractere.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Parolele nu coincid.");
      return;
    }
    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        current: currentPassword.trim(),
        newpass: newPassword.trim(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setPasswordError(data.error || "Eroare la schimbarea parolei.");
    } else {
      setPasswordSuccess("Parola a fost schimbată cu succes!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    }
  };

  return (
    <>
      <Head>
        <title>Dashboard utilizator – Randări 3D</title>
      </Head>

      <main className="min-h-screen px-6 py-10 bg-background text-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Sidebar */}
          {status === "authenticated" && session?.user && (
            <div className="space-y-6">
              
              {/* Profil utilizator */}
              <div className="card-neumorph p-4 space-y-2">
                <h2 className="text-lg font-bold">Profil utilizator</h2>
                <p className="text-sm"><span className="font-semibold">Nume:</span> {fullName}</p>
                <p className="text-sm"><span className="font-semibold">Email:</span> {session.user.email}</p>
              </div>

              {/* Facturare */}
              <div className="card-neumorph p-4">
                <h3 className="text-base font-semibold mb-1">Date facturare</h3>
                <p className="text-sm text-muted-foreground mb-2">Completare pentru Oblio</p>
                <div className="flex gap-4 mb-4">
                  <label className="flex gap-2 items-center">
                    <input
                      type="radio"
                      checked={billing.type === "pf"}
                      onChange={() => {
                        setBilling((b) => ({ ...b, type: "pf" }));
                        setShowBillingForm(true);
                      }}
                    /> Persoană fizică
                  </label>
                  <label className="flex gap-2 items-center">
                    <input
                      type="radio"
                      checked={billing.type === "pj"}
                      onChange={() => {
                        setBilling((b) => ({ ...b, type: "pj" }));
                        setShowBillingForm(true);
                      }}
                    /> Persoană juridică
                  </label>
                </div>
                {showBillingForm && (
                  <form onSubmit={handleBillingSave} className="space-y-3">
                    {billing.type === "pj" ? (
                      <div>
                        <label className="block text-sm font-medium">CUI</label>
                        <Input
                          value={billing.cui || ""}
                          onChange={(e) => setBilling({ ...billing, cui: e.target.value })}
                          required
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-sm font-medium">Nume complet</label>
                          <Input
                            value={billing.name || ""}
                            onChange={(e) => setBilling({ ...billing, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Adresă</label>
                          <Input
                            value={billing.address || ""}
                            onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Localitate</label>
                          <Input
                            value={billing.city || ""}
                            onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Județ</label>
                          <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={billing.county || ""}
                            onChange={(e) => setBilling({ ...billing, county: e.target.value })}
                            required
                          >
                            <option value="">Selectează județul</option>
                            {judeteRO.map((j) => (
                              <option key={j} value={j}>{j}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Email factură</label>
                          <Input
                            type="email"
                            value={billing.email || ""}
                            onChange={(e) => setBilling({ ...billing, email: e.target.value })}
                            required
                          />
                        </div>
                      </>
                    )}
                    <Button type="submit" className="w-full" disabled={billingLoading}>
                      {billingLoading ? "Salvare..." : "Salvează datele"}
                    </Button>
                    {billingError && <p className="text-red-600 text-xs">{billingError}</p>}
                    {billingSuccess && <p className="text-green-600 text-xs">{billingSuccess}</p>}
                  </form>
                )}
              </div>

              {/* Afiliere */}
              <div className="card-neumorph p-4">
                <h3 className="text-base font-semibold mb-1">Afiliere</h3>
                <p className="text-sm text-muted-foreground mb-2">Link-ul tău unic</p>
                <Input value={referralLink} readOnly onFocus={(e) => e.target.select()} />
                <p className="text-xs mt-2 text-muted-foreground">
                  Trimite acest link și primești puncte pentru utilizatori noi!
                </p>
                <ScrollArea className="mt-4 h-24">
                  {referrals.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Niciun afiliat încă.</p>
                  ) : (
                    <ul className="text-xs space-y-1">
                      {referrals.map((r) => (
                        <li key={r.id}>{r.email} ({new Date(r.createdAt).toLocaleDateString("ro-RO")})</li>
                      ))}
                    </ul>
                  )}
                </ScrollArea>
              </div>

              {/* Parolă */}
              <div className="card-neumorph p-4">
                <h3 className="text-base font-semibold mb-1">Schimbă parola</h3>
                <Button onClick={() => setShowPasswordForm((v) => !v)} className="mb-4">
                  {showPasswordForm ? "Ascunde formularul" : "Schimbă parola"}
                </Button>
                {showPasswordForm && (
                  <form onSubmit={handlePasswordChange} className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Parola actuală"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Parola nouă"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Input
                      type="password"
                      placeholder="Confirmă parola nouă"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <Button type="submit" className="w-full">Salvează</Button>
                    {passwordError && <p className="text-red-600 text-xs">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-xs">{passwordSuccess}</p>}
                  </form>
                )}
              </div>
            </div>
          )}

          {/* Conținut principal */}
          <div className="col-span-2 space-y-8">
            
            {/* Istoric generări AI */}
            <div className="card-neumorph p-4">
              <h2 className="text-lg font-bold mb-4">Istoric generări AI</h2>
              {generations.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nu ai generări recente.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {generations.map((gen) => (
                    <div
                      key={gen.id}
                      className="card-neumorph p-0 cursor-pointer"
                      onClick={() => setModalImage(gen.imageUrl)}
                    >
                      <img src={gen.imageUrl} className="w-full h-40 object-cover rounded-t-[30px]" />
                      <div className="p-2">
                        <p className="text-xs font-semibold text-muted-foreground">{gen.robot}</p>
                        <p className="text-sm truncate">{gen.prompt}</p>
                        <span className="text-[11px] text-muted-foreground">{new Date(gen.createdAt).toLocaleString("ro-RO")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Istoric facturi */}
            {invoiceHistory.length > 0 && (
              <div className="card-neumorph p-4">
                <h2 className="text-lg font-bold mb-4">Istoric facturi</h2>
                <div className="space-y-3">
                  {invoiceHistory.map((inv) => (
                    <div key={inv.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="text-sm font-semibold">{inv.prompt}</p>
                        <p className="text-xs text-muted-foreground">{inv.robot}</p>
                        <p className="text-xs text-muted-foreground">{new Date(inv.createdAt).toLocaleString("ro-RO")}</p>
                      </div>
                      {inv.invoiceLink ? (
                        <a href={inv.invoiceLink} target="_blank" className="text-primary text-sm underline">Vezi factura</a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Indisponibil</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal imagine */}
        {modalImage && (
          <div
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
            onClick={() => setModalImage(null)}
          >
            <img src={modalImage} className="max-w-[90%] max-h-[90%] rounded-xl shadow-2xl" />
          </div>
        )}
      </main>
    </>
  );
}
