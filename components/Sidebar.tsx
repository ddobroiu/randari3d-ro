import Link from "next/link";
import { useRouter } from "next/router";
import { useTranslation } from "next-i18next";

export default function Sidebar() {
  const router = useRouter();
  const { t } = useTranslation("common");

  const navItems = [
    { label: t("generate"), path: "/generate" },
    { label: t("history"), path: "/history" },
    { label: t("billing"), path: "/billing" },
    { label: t("settings"), path: "/settings" }
  ];

  return (
    <aside className="w-64 bg-[#111] p-6 space-y-4">
      <h1 className="text-xl font-bold text-blue-400">Render3D</h1>
      <nav className="space-y-2">
        {navItems.map((item) => (
          <Link key={item.path} href={item.path}>
            <span
              className={`block px-2 py-1 rounded ${
                router.pathname === item.path
                  ? "text-blue-400 font-semibold"
                  : "text-white hover:text-blue-400"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
