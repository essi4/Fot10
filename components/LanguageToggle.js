"use client";

import { useEffect, useState } from "react";

const TEAM_FA = {
  "Esteghlal": "استقلال",
  "Esteghlal FC": "استقلال",
  "Persepolis": "پرسپولیس",
  "Persepolis FC": "پرسپولیس",
  "Sepahan": "سپاهان",
  "Sepahan SC": "سپاهان",
  "Tractor": "تراکتور",
  "Tractor FC": "تراکتور",
  "Foolad": "فولاد",
  "Foolad Khuzestan": "فولاد خوزستان",
  "Gol Gohar": "گل‌گهر",
  "Gol Gohar Sirjan": "گل‌گهر سیرجان",
  "Zob Ahan": "ذوب‌آهن",
  "Aluminium Arak": "آلومینیوم اراک",
  "Malavan": "ملوان",
  "Kheybar Khorramabad": "خیبر خرم‌آباد",
  "Chadormalu": "چادرملو",
  "Chadormalu SC": "چادرملو",
  "Mes Rafsanjan": "مس رفسنجان",
  "Mes Kerman": "مس کرمان",
  "Esteghlal Khuzestan": "استقلال خوزستان",
  "Havadar": "هوادار",
  "Paykan": "پیکان",
  "Shams Azar Qazvin": "شمس‌آذر قزوین",
  "Nassaji Mazandaran": "نساجی مازندران",
  "Sanat Naft": "صنعت نفت آبادان",
  "Sepidrood": "سپیدرود",
  "Pars Jonoubi Jam": "پارس جنوبی جم",
};

const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();

function translateText(root, english) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) nodes.push(node);

  for (const textNode of nodes) {
    const original = textNode.__fot10Original || textNode.nodeValue;
    const value = normalize(original);
    if (!value) continue;

    if (!textNode.__fot10Original) textNode.__fot10Original = textNode.nodeValue;
    if (english) {
      textNode.nodeValue = textNode.__fot10Original;
      continue;
    }

    let next = textNode.__fot10Original;
    for (const [en, fa] of Object.entries(TEAM_FA)) {
      next = next.replace(new RegExp(`(^|[^A-Za-z])${en.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}(?=$|[^A-Za-z])`, "g"), `$1${fa}`);
    }
    textNode.nodeValue = next;
  }
}

export default function LanguageToggle() {
  const [english, setEnglish] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("fot10-language");
    const initial = saved === "en";
    setEnglish(initial);

    const apply = (isEnglish) => {
      translateText(document.body, isEnglish);
      document.documentElement.lang = isEnglish ? "en" : "fa";
    };

    apply(initial);
    const observer = new MutationObserver(() => apply(initialRef.current));
    const initialRef = { current: initial };
    observer.disconnect();
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  const change = (nextEnglish) => {
    setEnglish(nextEnglish);
    window.localStorage.setItem("fot10-language", nextEnglish ? "en" : "fa");
    translateText(document.body, nextEnglish);
    document.documentElement.lang = nextEnglish ? "en" : "fa";
  };

  return (
    <div className="fixed right-3 top-3 z-[60] flex items-center gap-1 rounded-2xl border border-white/10 bg-[#0b101a]/90 p-1 shadow-lg backdrop-blur-xl" aria-label="زبان برنامه">
      <button type="button" onClick={() => change(false)} className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black transition ${!english ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5"}`}>فارسی</button>
      <button type="button" onClick={() => change(true)} className={`rounded-xl px-2.5 py-1.5 text-[10px] font-black transition ${english ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:bg-white/5"}`}>English</button>
    </div>
  );
}
