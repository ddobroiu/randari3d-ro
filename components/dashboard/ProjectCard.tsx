import { FaClock, FaExclamationCircle, FaPlayCircle, FaDownload, FaEdit, FaMagic, FaVideo, FaPaintRoller, FaEraser } from "react-icons/fa";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

const RobotIcons: Record<string, any> = {
  "video": <FaVideo className="text-purple-500" />,
  "design": <FaPaintRoller className="text-blue-500" />,
  "create": <FaMagic className="text-amber-500" />,
  "editor": <FaEraser className="text-pink-500" />,
};

interface ProjectCardProps {
  item: any; // Ideal ar fi tipul 'Generation' definit strict
  onClick: () => void;
  onEdit: (url: string, robot: string) => void;
  onCopy: (text: string) => void;
}

export default function ProjectCard({ item, onClick, onEdit, onCopy }: ProjectCardProps) {
  const isVideo = item.imageUrl.startsWith("data:video") || item.robot.includes("video") || item.imageUrl.endsWith(".mp4");

  return (
    <div className="group bg-white dark:bg-[#151a23] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Media Area */}
      <div 
        className="relative aspect-square cursor-pointer bg-slate-100 dark:bg-slate-900 overflow-hidden"
        onClick={onClick}
      >
        {item.status === "processing" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100/80 dark:bg-slate-800/80 backdrop-blur-sm z-10">
            <FaClock className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <span className="text-xs font-bold text-blue-600 animate-pulse">Generare...</span>
          </div>
        ) : item.status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50/90 dark:bg-red-900/50 z-10">
            <FaExclamationCircle className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-xs font-bold text-red-500">Eroare</span>
          </div>
        ) : (
          <>
            {isVideo ? (
              <div className="w-full h-full flex items-center justify-center bg-black">
                <video src={item.imageUrl} className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FaPlayCircle className="w-12 h-12 text-white opacity-80 group-hover:scale-110 transition-transform" />
                </div>
              </div>
            ) : (
              <img src={item.imageUrl} alt="Result" loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            )}
            
            {/* Hover Actions */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
              <div className="flex gap-2 justify-end">
                <a href={item.imageUrl} download onClick={(e) => e.stopPropagation()} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-md transition" title="Descarcă">
                  <FaDownload className="w-4 h-4" />
                </a>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content Area */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
            {RobotIcons[item.robot] || <FaMagic />}
            <span>{item.robot}</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {new Date(item.createdAt).toLocaleDateString("ro-RO")}
          </span>
        </div>
        
        <div className="relative group/text mb-4 flex-1">
          <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2" title={item.prompt}>
            {item.prompt}
          </p>
          <button 
            onClick={() => onCopy(item.prompt)}
            className="absolute top-0 right-0 p-1 bg-background shadow-sm border rounded opacity-0 group-hover/text:opacity-100 transition text-xs"
            title="Copiază Prompt"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>

        {!isVideo && item.status === 'completed' && (
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full mt-auto"
            onClick={() => onEdit(item.imageUrl, item.robot)}
          >
            <FaEdit className="mr-2 w-3 h-3" /> Editează
          </Button>
        )}
      </div>
    </div>
  );
}