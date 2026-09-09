const TEAM_FA = {
  Esteghlal: "استقلال", "Esteghlal FC": "استقلال", Persepolis: "پرسپولیس", "Persepolis FC": "پرسپولیس",
  Sepahan: "سپاهان", "Sepahan SC": "سپاهان", Tractor: "تراکتور", "Tractor FC": "تراکتور",
  Foolad: "فولاد", "Foolad Khuzestan": "فولاد خوزستان", "Gol Gohar": "گل‌گهر", "Gol Gohar Sirjan": "گل‌گهر سیرجان",
  "Zob Ahan": "ذوب‌آهن", "Aluminium Arak": "آلومینیوم اراک", Malavan: "ملوان", "Kheybar Khorramabad": "خیبر خرم‌آباد",
  Chadormalu: "چادرملو", "Chadormalu SC": "چادرملو", "Mes Rafsanjan": "مس رفسنجان", "Mes Kerman": "مس کرمان",
  "Esteghlal Khuzestan": "استقلال خوزستان", Havadar: "هوادار", Paykan: "پیکان", "Shams Azar Qazvin": "شمس‌آذر قزوین",
  "Nassaji Mazandaran": "نساجی مازندران", "Sanat Naft": "صنعت نفت آبادان", Sepidrood: "سپیدرود", "Pars Jonoubi Jam": "پارس جنوبی جم",
  "Mes Shahr": "مس شهر بابک", "Fajr Sepasi": "فجر سپاسی",
  "Manchester United": "منچستریونایتد", "Manchester City": "منچسترسیتی", Liverpool: "لیورپول", Arsenal: "آرسنال", Chelsea: "چلسی", Tottenham: "تاتنهام",
  "Real Madrid": "رئال مادرید", Barcelona: "بارسلونا", "Atletico Madrid": "اتلتیکو مادرید", Sevilla: "سویا", Valencia: "والنسیا",
  "Bayern Munich": "بایرن مونیخ", Dortmund: "دورتموند", "Borussia Dortmund": "بوروسیا دورتموند", "RB Leipzig": "لایپزیگ", Juventus: "یوونتوس", Inter: "اینتر", "AC Milan": "آث میلان", Milan: "میلان", Napoli: "ناپولی", Roma: "رم",
  "Paris Saint Germain": "پاری‌سن‌ژرمن", "Paris Saint-Germain": "پاری‌سن‌ژرمن", Marseille: "مارسی", Lyon: "لیون",
  Ajax: "آژاکس", "PSV Eindhoven": "پی‌اس‌وی آیندهوون", Porto: "پورتو", Benfica: "بنفیکا", "Sporting CP": "اسپورتینگ"
};

export function displayTeamName(name) {
  if (!name) return "—";
  return TEAM_FA[name] || name.replace(/\b(FC|SC|CF)\b/gi, "").replace(/\s+/g, " ").trim();
}

export function displayTeamLogo(id, logo) {
  if (logo) return logo;
  return id && !String(id).startsWith("iran-") ? `https://media.api-sports.io/football/teams/${id}.png` : null;
}

export function localizeMatches(matches) {
  return matches.map((match) => ({
    ...match,
    home: displayTeamName(match.home),
    away: displayTeamName(match.away),
    homeLogo: displayTeamLogo(match.homeId, match.homeLogo),
    awayLogo: displayTeamLogo(match.awayId, match.awayLogo),
  }));
}
