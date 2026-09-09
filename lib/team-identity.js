export const TEAM_FA = {
  Esteghlal: "استقلال", "Esteghlal FC": "استقلال", Persepolis: "پرسپولیس", "Persepolis FC": "پرسپولیس",
  Sepahan: "سپاهان", "Sepahan SC": "سپاهان", Tractor: "تراکتور", "Tractor FC": "تراکتور",
  Foolad: "فولاد", "Foolad Khuzestan": "فولاد خوزستان", "Gol Gohar": "گل‌گهر", "Gol Gohar Sirjan": "گل‌گهر سیرجان",
  "Zob Ahan": "ذوب‌آهن", "Aluminium Arak": "آلومینیوم اراک", Malavan: "ملوان", "Kheybar Khorramabad": "خیبر خرم‌آباد",
  Chadormalu: "چادرملو", "Chadormalu SC": "چادرملو", "Mes Rafsanjan": "مس رفسنجان", "Mes Kerman": "مس کرمان",
  "Esteghlal Khuzestan": "استقلال خوزستان", Havadar: "هوادار", Paykan: "پیکان", "Shams Azar Qazvin": "شمس‌آذر قزوین",
  "Nassaji Mazandaran": "نساجی مازندران", "Sanat Naft": "صنعت نفت آبادان", Sepidrood: "سپیدرود", "Pars Jonoubi Jam": "پارس جنوبی جم",
  "Mes Shahr": "مس شهر بابک", "Fajr Sepasi": "فجر سپاسی"
};

export function teamName(name, english = false) {
  if (!name) return "—";
  return english ? name : (TEAM_FA[name] || name);
}

export function teamLogoUrl(id) {
  return id && !String(id).startsWith("iran-") ? `https://media.api-sports.io/football/teams/${id}.png` : null;
}
