"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, RefreshCw } from "lucide-react";

const REFRESH_SECONDS = 30;

export default function StandingsProfessional() {
  const router = useRouter();
  const [seconds, setSeconds] = useState(REFRESH_SECONDS);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setSyncing(true);
      router.refresh();
      window.setTimeout(() => setSyncing(false), 900);
      setSeconds(REFRESH_SECONDS);
    };

    const countdown = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          refresh();
          return REFRESH_SECONDS;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(countdown);
  }, [router]);

  return (
    <div className="flex justify-center -mb-2">
      <div
        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.06] px-3 py-1.5 text-[9px] font-bold text-emerald-300 shadow-lg shadow-emerald-950/10"
        title="داده‌های جدول و نتایج هر ۳۰ ثانیه به‌روزرسانی می‌شوند"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <Activity size={12} />
        <span>داده زنده</span>
        <span className="text-emerald-200/60">·</span>
        <span className="tabular-nums">{syncing ? "در حال همگام‌سازی…" : `${seconds} ثانیه`}</span>
        <RefreshCw size={11} className={syncing ? "animate-spin" : "opacity-50"} />
      </div>
    </div>
  );
}
