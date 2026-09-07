"use client";

import { useMemo, useState } from "react";
import { Search, Star, TrendingUp } from "lucide-react";

const players = [
  {name:"Lamine Yamal", team:"Barcelona", pos:"RW", rating:"8.7", goals:12, assists:14},
  {name:"Kylian Mbappé", team:"Real Madrid", pos:"ST", rating:"8.6", goals:25, assists:6},
  {name:"Mohamed Salah", team:"Liverpool", pos:"RW", rating:"8.5", goals:21, assists:10},
  {name:"Bukayo Saka", team:"Arsenal", pos:"RW", rating:"8.3", goals:13, assists:9},
  {name:"Jude Bellingham", team:"Real Madrid", pos:"AM", rating:"8.2", goals:10, assists:8},
  {name:"Vinícius Júnior", team:"Real Madrid", pos:"LW", rating:"8.1", goals:16, assists:7},
];

export default function PlayersPage(){
 const [q,setQ]=useState(""); const filtered=useMemo(()=>players.filter(p=>(p.name+p.team).toLowerCase().includes(q.toLowerCase())),[q]);
 return <main className="mobile-shell pb-10"><header className="px-5 pb-5 pt-6"><div className="flex items-center justify-between"><div><p className="text-xs text-sky-400">FOT10 • PLAYERS</p><h1 className="mt-1 text-2xl font-black">بازیکنان</h1></div><TrendingUp className="text-emerald-400"/></div><div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3"><Search size={18} className="text-slate-500"/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="جستجوی بازیکن یا تیم..." className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/></div></header><section className="space-y-3 px-5">{filtered.map((p,i)=><article key={p.name} className="glass rounded-3xl p-4"><div className="flex items-center gap-3"><div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500/30 to-emerald-400/10 text-lg font-black">{i+1}<span className="absolute -bottom-1 -left-1 rounded-lg bg-[#0d1220] px-1.5 py-0.5 text-[9px] text-slate-500">{p.pos}</span></div><div className="min-w-0 flex-1"><h2 className="truncate font-black">{p.name}</h2><p className="mt-1 text-xs text-slate-500">{p.team}</p></div><div className="text-left"><b className="text-xl text-emerald-400">{p.rating}</b><p className="text-[10px] text-slate-600">ریتینگ</p></div><Star size={17} className="text-slate-500"/></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">گل</p><b className="text-lg">{p.goals}</b></div><div className="rounded-2xl bg-white/5 p-3"><p className="text-[10px] text-slate-500">پاس گل</p><b className="text-lg">{p.assists}</b></div></div></article>)}{!filtered.length&&<div className="py-12 text-center text-sm text-slate-500">بازیکنی پیدا نشد.</div>}</section></main>
}
