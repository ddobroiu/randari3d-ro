import Link from "next/link";
import { useRouter } from "next/router";
import { 
  FaVideo, 
  FaPaintRoller, 
  FaMagic, 
  FaEraser, 
  FaHome, 
  FaUser,
  FaSignOutAlt 
} from "react-icons/fa";
import { signOut } from "next-auth/react";

export default function Sidebar() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  const menuItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Profil & Plan", path: "/planuri", icon: <FaUser /> },
  ];

  const studioItems = [
    { name: "Studio Video", path: "/robots/video", icon: <FaVideo /> },
    { name: "Studio Design", path: "/robots/design", icon: <FaPaintRoller /> },
    { name: "Studio Creație", path: "/robots/create", icon: <FaMagic /> },
    { name: "Studio Editor", path: "/robots/editor", icon: <FaEraser /> },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-[#151a23] border-r border-slate-200 dark:border-[#23263a] hidden md:flex flex-col h-screen sticky top-0">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
        <span className="font-bold text-xl tracking-tight">Randări3D</span>
      </div>

      <div className="flex-1 px-4 py-4 space-y-8 overflow-y-auto">
        
        {/* Meniu Principal */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Principal</p>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive(item.path)
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Instrumente AI (Studiourile Noi) */}
        <div>
          <p className="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Studiouri AI</p>
          <nav className="space-y-1">
            {studioItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                  isActive(item.path)
                    ? "bg-purple-600 text-white shadow-md shadow-purple-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-[#23263a]">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl w-full transition-colors"
        >
          <FaSignOutAlt />
          Deconectare
        </button>
      </div>
    </aside>
  );
}