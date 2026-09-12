"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, Heart, Search, Shield, SlidersHorizontal, Sparkles, Star, Trash2 } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase/client";

const fallbackPlayers = [
  { team: "ایتالیا", country: "ایتالیا", type: "national", name: "روبرتو باجو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Roberto_Baggio_cropped.jpg", memoryTitle: "پنالتی ۱۹۹۴", memory: "شماره ۱۰ ایتالیا در جام جهانی ۱۹۹۴ و یکی از ماندگارترین لحظه‌های فوتبال." },
  { team: "آرژانتین", country: "آرژانتین", type: "national", name: "دیه‌گو مارادونا", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Diego_Maradona_2012.jpg", memoryTitle: "مکزیک ۱۹۸۶", memory: "شماره ۱۰ آرژانتین و نماد جام جهانی ۱۹۸۶." },
  { team: "برزیل", country: "برزیل", type: "national", name: "پله", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Pele_con_brasil_(cropped).jpg", memoryTitle: "۱۰ جاودانه", memory: "یکی از نمادین‌ترین شماره‌های ۱۰ تاریخ فوتبال برزیل." },
  { team: "فرانسه", country: "فرانسه", type: "national", name: "زین‌الدین زیدان", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Zinedine_Zidane_2008.jpg", memoryTitle: "فرانسه ۱۹۹۸", memory: "شماره ۱۰ فرانسه و قهرمان جام جهانی ۱۹۹۸." },
  { team: "بارسلونا", country: "اسپانیا", type: "club", name: "رونالدینیو", number: 10, era: "legend", image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ronaldinho_2006.jpg", memoryTitle: "جادوی نیوکمپ", memory: "یکی از ماندگارترین شماره‌های ۱۰ بارسلونا." },
];

const NATIONAL_TEAMS = new Set(["ایران", "آرژانتین", "برزیل", "فرانسه", "ایتالیا", "اسپانیا", "آلمان", "انگلیس", "هلند", "پرتغال", "بلژیک", "کرواسی", "اروگوئه", "مکزیک", "کلمبیا", "شیلی", "ژاپن", "کره جنوبی", "آمریکا", "سوئیس", "دانمارک", "سوئد", "صربستان", "لهستان", "سنگال", "مراکش", "کامرون", "نیجریه", "مصر", "پرو", "رومانی", "مجارستان", "غنا"]);

const COUNTRY_CODES = {
  "ایران": "ir", "آرژانتین": "ar", "برزیل": "br", "فرانسه": "fr", "ایتالیا": "it", "اسپانیا": "es", "آلمان": "de", "انگلیس": "gb", "هلند": "nl", "پرتغال": "pt", "بلژیک": "be", "کرواسی": "hr", "اروگوئه": "uy", "مکزیک": "mx", "کلمبیا": "co", "شیلی": "cl", "ژاپن": "jp", "کره جنوبی": "kr", "آمریکا": "us", "سوئیس": "ch", "دانمارک": "dk", "سوئد": "se", "صربستان": "rs", "لهستان": "pl", "سنگال": "sn", "مراکش": "ma", "کامرون": "cm", "نیجریه": "ng", "مصر": "eg", "پرو": "pe", "رومانی": "ro", "مجارستان": "hu", "غنا": "gh", "اسکاتلند": "gb-sct", "ولز": "gb-wls", "ترکیه": "tr", "اوکراین": "ua", "روسیه": "ru", "اتریش": "at", "چک": "cz", "اسلواکی": "sk", "اسلوونی": "si", "یونان": "gr", "نروژ": "no", "فنلاند": "fi", "ایرلند": "ie", "آفریقای جنوبی": "za", "الجزایر": "dz", "تونس": "tn", "عربستان": "sa", "استرالیا": "au", "کانادا": "ca"
};
