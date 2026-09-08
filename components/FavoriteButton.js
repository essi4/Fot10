"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getSupabaseBrowserClient } from "../lib/supabase/client";

function readLocal() {
  try { return JSON.parse(localStorage.getItem("fot10-profile") || "{}"); } catch { return {}; }
}

function storageKey(type) {
  if (type === "league") return "favoriteLeagues";
  if (type === "player") return "favoritePlayers";
  return "favorites";
}

export default function FavoriteButton({ type, name, className = "" }) {
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!name) return;
    const raw = readLocal();
    const list = raw[storageKey(type)];
    setActive(Array.isArray(list) && list.includes(name));

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data?.user || !mounted) return;
      const { data: rows } = await supabase.from("fot10_favorites").select("id").eq("user_id", data.user.id).eq("item_type", type).eq("item_name", name).limit(1);
      if (mounted && Array.isArray(rows)) setActive(rows.length > 0);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [type, name]);

  async function toggle(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!name || busy) return;
    setBusy(true);
    const next = !active;
    setActive(next);

    try {
      const raw = readLocal();
      const key = storageKey(type);
      const list = Array.isArray(raw[key]) ? raw[key] : [];
      const updated = next ? [...new Set([...list, name])] : list.filter(item => item !== name);
      localStorage.setItem("fot10-profile", JSON.stringify({ ...raw, [key]: updated }));

      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        if (data?.user) {
          if (next) {
            const { error } = await supabase.from("fot10_favorites").upsert({ user_id: data.user.id, item_type: type, item_name: name }, { onConflict: "user_id,item_type,item_name" });
            if (error) throw error;
          } else {
            const { error } = await supabase.from("fot10_favorites").delete().eq("user_id", data.user.id).eq("item_type", type).eq("item_name", name);
            if (error) throw error;
          }
        }
      }
      window.dispatchEvent(new CustomEvent("fot10-favorites-changed"));
    } catch {
      setActive(!next);
    } finally {
      setBusy(false);
    }
  }

  return <button type="button" onClick={toggle} disabled={busy} aria-label={active ? `${name} از علاقه‌مندی حذف شود` : `${name} به علاقه‌مندی اضافه شود`} aria-pressed={active} title={active ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black transition active:scale-95 disabled:opacity-60 ${active ? "bg-rose-400 text-slate-950" : "glass text-rose-300"} ${className}`}><Heart size={17} fill={active ? "currentColor" : "none"}/>{active ? "محبوب" : "علاقه‌مندی"}</button>;
}
