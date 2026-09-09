"use client";

import { Activity, Heart, Home, Trophy, Tv } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["خانه", Home, "/"],
  ["علاقه‌مندی‌ها", Heart, "/favorites"],
  ["نتایج زنده", Tv, "/matches?live=1"],
  ["لیگ‌ها", Trophy, "/leagues"],
  ["مسابقه", Activity, "/matches"],
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fot-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#05070d]/92 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 backdrop-blur-2xl shadow-[0_-12px_35px_rgba(0,0,0,.28)]">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {items.map(([label, Icon, href]) => {
          const base = href.split("?")[0];
          const active = base === "/" ? pathname === "/" : pathname === base || pathname?.startsWith(`${base}/`);
          return (
            <Link key={label} href={href} className={`group flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[8px] font-black transition-all ${active ? "bg-emerald-400/10 text-emerald-300" : "text-slate-500 hover:bg-white/[.04] hover:text-slate-300"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${active ? "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/20" : "bg-white/[.045] text-slate-500 group-hover:text-slate-300"}`}><Icon size={17} /></span>
              <span className="truncate leading-3">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
