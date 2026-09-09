export const TEAM_FA = {
  Esteghlal: "استقلال", "Esteghlal FC": "استقلال", Persepolis: "پرسپولیس", "Persepolis FC": "پرسپولیس",
  Sepahan: "سپاهان", "Sepahan SC": "سپاهان", Tractor: "تراکتور", "Tractor FC": "تراکتور",
  Foolad: "فولاد", "Foolad Khuzestan": "فولاد خوزستان", "Gol Gohar": "گل‌گهر", "Gol Gohar Sirjan": "گل‌گهر سیرجان",
  "Zob Ahan": "ذوب‌آهن", "Aluminium Arak": "آلومینیوم اراک", Malavan: "ملوان", "Kheybar Khorramabad": "خیبر خرم‌آباد",
  Chadormalu: "چادرملو", "Chadormalu SC": "چادرملو", "Mes Rafsanjan": "مس رفسنجان", "Mes Kerman": "مس کرمان",
  "Esteghlal Khuzestan": "استقلال خوزستان", Havadar: "هوادار", Paykan: "پیکان", "Shams Azar Qazvin": "شمس‌آذر قزوین",
  "Nassaji Mazandaran": "نساجی مازندران", "Sanat Naft": "صنعت نفت آبادان", Sepidrood: "سپیدرود", "Pars Jonoubi Jam": "پارس جنوبی جم",
  "Mes Shahr": "مس شهر بابک", "Fajr Sepasi": "فجر سپاسی",
  Liverpool: "لیورپول", "Liverpool FC": "لیورپول", Arsenal: "آرسنال", "Arsenal FC": "آرسنال",
  Chelsea: "چلسی", "Chelsea FC": "چلسی", "Manchester United": "منچستریونایتد", "Manchester United FC": "منچستریونایتد",
  "Manchester City": "منچسترسیتی", "Manchester City FC": "منچسترسیتی", Tottenham: "تاتنهام", "Tottenham Hotspur": "تاتنهام",
  "Newcastle": "نیوکاسل", "Newcastle United": "نیوکاسل یونایتد", "Aston Villa": "استون ویلا", Everton: "اورتون",
  "West Ham": "وستهم", "West Ham United": "وستهم", Brighton: "برایتون", "Crystal Palace": "کریستال پالاس",
  Barcelona: "بارسلونا", "FC Barcelona": "بارسلونا", "Real Madrid": "رئال مادرید", "Atletico Madrid": "اتلتیکومادرید",
  "Atletico de Madrid": "اتلتیکومادرید", Sevilla: "سویا", Valencia: "والنسیا", Villarreal: "ویارئال", "Real Betis": "رئال بتیس",
  "Athletic Club": "اتلتیک بیلبائو", Girona: "خیرونا", "Real Sociedad": "رئال سوسیداد",
  "Bayern Munich": "بایرن مونیخ", "Bayern München": "بایرن مونیخ", Dortmund: "دورتموند", "Borussia Dortmund": "دورتموند",
  "RB Leipzig": "لایپزیگ", "Bayer Leverkusen": "بایرلورکوزن", "Eintracht Frankfurt": "آینتراخت فرانکفورت",
  Juventus: "یوونتوس", "Inter": "اینتر", "Inter Milan": "اینتر میلان", Milan: "میلان", "AC Milan": "آث میلان",
  Napoli: "ناپولی", Roma: "رم", Lazio: "لاتزیو", Atalanta: "آتالانتا", Fiorentina: "فیورنتینا",
  "Paris Saint Germain": "پاری‌سن‌ژرمن", "Paris Saint-Germain": "پاری‌سن‌ژرمن", Marseille: "مارسی", Lyon: "لیون", Monaco: "موناکو",
  "Ajax": "آژاکس", "PSV Eindhoven": "پی‌اس‌وی آیندهوون", "Feyenoord": "فاینورد", "Porto": "پورتو",
  "Benfica": "بنفیکا", "Sporting CP": "اسپورتینگ لیسبون", "Galatasaray": "گالاتاسرای", "Fenerbahce": "فنرباغچه",
  "Fenerbahçe": "فنرباغچه", "Besiktas": "بشیکتاش", "Beşiktaş": "بشیکتاش"
};

const WORD_FA = {
  FC: "", United: "یونایتد", City: "سیتی", Town: "تاون", Hotspur: "هاتسپر", Athletic: "اتلتیک", Real: "رئال",
  Sporting: "اسپورتینگ", Club: "کلاب", Wanderers: "واندررز", Rovers: "روورز", County: "کانتی"
};

export function teamName(name, english = false) {
  if (!name) return "—";
  if (english) return name;
  const direct = TEAM_FA[name] || TEAM_FA[String(name).trim()];
  if (direct) return direct;
  const cleaned = String(name).replace(/\bFC\b/g, "").replace(/\s+/g, " ").trim();
  const translated = cleaned.split(" ").map((word) => WORD_FA[word] || word).join(" ").trim();
  return translated || name;
}

export function teamLogoUrl(id) {
  return id && !String(id).startsWith("iran-") ? `https://media.api-sports.io/football/teams/${id}.png` : null;
}
