// pages/index.tsx
import Head from "next/head";
import Link from "next/link";
// Am eliminat importul Layout pentru a nu-l duplica
import { ROBOTS } from "@/lib/robots-config"; 
import { ArrowRight, Wand2, Video, Image as ImageIcon, Layers, Zap, CheckCircle2 } from "lucide-react";

export default function Home() {
  // Convertim obiectul ROBOTS în array pentru a-l putea mapa ușor
  const features = Object.values(ROBOTS);

  // Funcție helper pentru a alege iconița potrivită bazat pe ID-ul robotului
  const getIcon = (id: string) => {
    switch (id) {
      case "video": return <Video className="w-6 h-6" />;
      case "design": return <Layers className="w-6 h-6" />;
      case "create": return <Wand2 className="w-6 h-6" />;
      case "editor": return <ImageIcon className="w-6 h-6" />;
      default: return <Zap className="w-6 h-6" />;
    }
  };

  return (
    <>
      <Head>
        <title>Randări 3D & Design AI - Transformă Ideile în Realitate</title>
        <meta name="description" content="Platformă de generare randări 3D și design interior folosind Inteligența Artificială." />
      </Head>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden bg-background pt-16 md:pt-24 lg:pt-32 pb-16">
        {/* Elemente decorative de fundal (blobs) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/30 rounded-full blur-[100px]" />
        </div>

        <div className="container relative z-10 px-4 md:px-6 mx-auto text-center">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6 bg-secondary/50 text-secondary-foreground">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Nou: Studio Video cu Google Veo
          </div>
          
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl mb-6 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-gray-400">
            Design Interior și Randări 3D <br className="hidden md:block" />
            <span className="text-primary">Generate de AI</span>
          </h1>

          <p className="mx-auto max-w-[700px] text-lg text-muted-foreground mb-10 leading-relaxed">
            Transformă schițe simple în randări fotorealiste, reamenajează camere existente sau creează videoclipuri cinematice în câteva secunde. Fără cunoștințe tehnice necesare.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Începe Gratuit
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link 
              href="/portofoliu" 
              className="inline-flex items-center justify-center h-12 px-8 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
            >
              Vezi Exemple
            </Link>
          </div>

          {/* Mini statistici sau trust markers */}
          <div className="mt-12 pt-8 border-t border-border/50 flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Randare Instantanee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Calitate 8K</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span>Fără Abonament Obligatoriu</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES GRID (Dinamic din robots-config) --- */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Ce poți crea?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Folosește suita noastră de unelte AI pentru a acoperi toate nevoile proiectului tău de design.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((robot) => (
              <div 
                key={robot.id} 
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-background p-6 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {getIcon(robot.id)}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{robot.title}</h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                    {robot.description}
                  </p>
                </div>
                
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-4">
                    <span>Cost: {robot.credits} credite</span>
                    <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground uppercase text-[10px]">
                      {robot.type === 'video' ? 'Video' : 'Imagine'}
                    </span>
                  </div>
                  <Link 
                    href={robot.endpoint.replace('/api/robots', '/robots')} 
                    className="flex w-full items-center justify-center rounded-md bg-secondary py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  >
                    Deschide Studio
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20">
        <div className="container px-4 mx-auto">
          <div className="relative rounded-3xl bg-primary px-6 py-16 md:px-16 md:py-24 text-center overflow-hidden">
            {/* Pattern decorativ pe fundal */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
                Gata să transformi spațiul tău?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-10">
                Alătură-te arhitecților, designerilor și pasionaților care folosesc deja platforma noastră pentru a economisi timp și bani.
              </p>
              <Link 
                href="/register" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-full bg-background text-primary font-bold text-lg hover:bg-background/90 transition-transform hover:scale-105"
              >
                Creează Cont Gratuit
              </Link>
              <p className="mt-4 text-xs text-primary-foreground/60">
                Primești 5 credite gratuit la înregistrare.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}