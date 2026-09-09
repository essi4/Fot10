"use client";

import { useEffect, useState } from "react";
import { TEAM_FA } from "../lib/team-identity";

function translateText(root, english) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);
  for (const textNode of nodes) {
    if (!textNode.__fot10Original) textNode.__fot10Original = textNode.nodeValue;
    if (english) { textNode.nodeValue = textNode.__fot10Original; continue; }
    let next = textNode.__fot10Original;
    for (const [en, fa] of Object.entries(TEAM_FA)) next = next.split(en).join(fa);
    textNode.nodeValue = next;
  }
}

export default function LanguageToggle() {
  const [english, setEnglish] = useState(false);
  useEffect(() => {
    const apply = (isEnglish) => {
      translateText(document.body, isEnglish);
      document.documentElement.lang = isEnglish ? "en" : "fa";
      document.documentElement.dir = isEnglish ? "ltr" : "rtl";
    };
    const initial = window.localStorage.getItem("fot10-language") === "en";
    setEnglish(initial); apply(initial);
    const observer = new MutationObserver(() => apply(window.localStorage.getItem("fot10-language") === "en"));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);
  const change = (nextEnglish) => {
    setEnglish(nextEnglish);
    window.localStorage.setItem("fot10-language", nextEnglish ? "en" : "fa");
    translateText(document.body, nextEnglish);
    document.documentElement.lang = nextEnglish ? "en" : "fa";
    document.documentElement.dir = nextEnglish ? "ltr" : "rtl";
  };
  return <div className="fixed right-3 top-3 z-[60] flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0b101a]/90 p-1 shadow-lg backdrop-blur-xl" aria-label="زبان برنامه">
    <button type="button" onClick={() => change(false)} className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black ${!english ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5"}`}>فارسی</button>
    <button type="button" onClick={() => change(true)} className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black ${english ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5"}`}>English</button>
  </div>;
}
