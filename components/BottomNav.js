"use client";

import { Activity, Heart, House, Radio, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["خانه", House, "/"],
  ["فوتبال منتخب", Shield, "/leagues"],
  ["نتایج زنده", Radio, "/matches?live=1"],
  ["علاقه‌مندی", Heart, "/favorites"],
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fot-bottom-nav fixed inset-x-0 bottom-0 z-50 border-t border-slate-200/90 bg-white/95 px-2 pb-[calc(8px+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_28px_rgba(15,23,42,.08)] backdrop-blur-xl">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {items.map(([label, Icon, href]) => {
          const base = href.split("?")[0];
          const active = pathname === base || pathname?.startsWith(`${base}/`);
          return (
            <Link key={label} href={href} className={`group flex min-w-0 touch-manipulation flex-col items-center gap-1 rounded-2xl px-1 py-2.5 text-[8px] font-black transition-all ${active ? "bg-slate-900/5 text-slate-900" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"}`}>
              <span className={`grid h-8 w-8 place-items-center rounded-xl transition-all ${active ? "bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-500 group-hover:text-slate-700"}`}>
                <Icon size={17} />
              </span>
              <span className="truncate leading-3">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
