"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

const DEFAULT_THEME = {
  name: "FOT10",
  team: "",
  image: "",
  accent: "#f6c453",
  accent2: "#12a8ff",
};

const TEAM_THEME = {
  "ایتالیا": { accent: "#25d366", accent2: "#ffffff" },
  "آرژانتین": { accent: "#72c8ff", accent2: "#ffffff" },
  "برزیل": { accent: "#f7d046", accent2: "#25d366" },
  "ایران": { accent: "#25d366", accent2: "#ffffff" },
  "فرانسه": { accent: "#4f8cff", accent2: "#e9eefc" },
  "بارسلونا": { accent: "#f2c94c", accent2: "#e63969" },
};

function applyTheme(golden) {
  const root = document.documentElement;
  const teamTheme = TEAM_THEME[golden?.team_name || golden?.team] || {};
  const theme = golden
    ? {
        name: golden.player_name || golden.name || "۱۰ طلایی",
        team: golden.team_name || golden.team || "",
        image: golden.player_image || golden.image || "",
        accent: teamTheme.accent || "#f6c453",
        accent2: teamTheme.accent2 || "#12a8ff",
      }
    : DEFAULT_THEME;

  root.style.setProperty("--golden-accent", theme.accent);
  root.style.setProperty("--golden-accent-2", theme.accent2);
  root.style.setProperty("--golden-player", theme.image ? `url(\"${theme.image}\")` : "none");
  root.dataset.golden10 = golden ? "on" : "off";
  root.dataset.golden10Player = theme.name;
  root.dataset.golden10Team = theme.team;
}

export default function Golden10Theme({ children }) {
  const [golden, setGolden] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      let local = null;
      try { local = JSON.parse(localStorage.getItem("fot10-golden10") || "null"); } catch {}
      if (mounted) { setGolden(local); applyTheme(local); }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!data?.user || !mounted) return;
      const result = await supabase
        .from("fot10_golden_tens")
        .select("team_name,player_name,player_image,shirt_number,memory_title,memory_text")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (mounted && result.data) {
        setGolden(result.data);
        applyTheme(result.data);
      }
    };

    const refresh = () => {
      try {
        const next = JSON.parse(localStorage.getItem("fot10-golden10") || "null");
        setGolden(next);
        applyTheme(next);
      } catch {}
      load();
    };

    load();
    window.addEventListener("storage", refresh);
    window.addEventListener("fot10-golden10-change", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      mounted = false;
      window.removeEventListener("storage", refresh);
      window.removeEventListener("fot10-golden10-change", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return (
    <>
      <div className="golden10-atmosphere" aria-hidden="true">
        <div className="golden10-player-image" />
        <div className="golden10-number">10</div>
      </div>
      <div className="golden10-badge" aria-hidden="true">
        <span>۱۰</span>
        {golden?.player_name && <small>{golden.player_name}</small>}
      </div>
      {children}
    </>
  );
}
