export const CONTINENTS = [
  {
    slug: "asia",
    name: "آسیا",
    icon: "🌏",
    countries: [
      ["ایران", "Iran", "🇮🇷", "لیگ برتر ایران", "iran", 290], ["ژاپن", "Japan", "🇯🇵", "J1 League", "j1-league", 98], ["کره جنوبی", "South Korea", "🇰🇷", "K League 1", "k-league-1", 292], ["عربستان", "Saudi Arabia", "🇸🇦", "Saudi Pro League", "saudi-pro-league", 307], ["قطر", "Qatar", "🇶🇦", "Qatar Stars League", "qatar-stars-league", 305], ["امارات", "United Arab Emirates", "🇦🇪", "UAE Pro League", "uae-pro-league", 301], ["چین", "China", "🇨🇳", "Chinese Super League", "chinese-super-league", 169], ["هند", "India", "🇮🇳", "Indian Super League", "indian-super-league", null], ["تایلند", "Thailand", "🇹🇭", "Thai League 1", "thai-league-1", null], ["ازبکستان", "Uzbekistan", "🇺🇿", "Uzbekistan Super League", "uzbekistan-super-league", null]
    ]
  },
  {
    slug: "europe",
    name: "اروپا",
    icon: "🇪🇺",
    countries: [
      ["انگلیس", "England", "🏴", "Premier League", "premier-league", 39], ["اسپانیا", "Spain", "🇪🇸", "LaLiga", "laliga", 140], ["آلمان", "Germany", "🇩🇪", "Bundesliga", "bundesliga", 78], ["ایتالیا", "Italy", "🇮🇹", "Serie A", "serie-a", 135], ["فرانسه", "France", "🇫🇷", "Ligue 1", "ligue-1", 61], ["هلند", "Netherlands", "🇳🇱", "Eredivisie", "eredivisie", 88], ["پرتغال", "Portugal", "🇵🇹", "Primeira Liga", "primeira-liga", 94], ["ترکیه", "Turkey", "🇹🇷", "Süper Lig", "super-lig", 203], ["بلژیک", "Belgium", "🇧🇪", "Jupiler Pro League", "belgium-pro-league", null], ["اسکاتلند", "Scotland", "🏴", "Premiership", "scotland-premiership", null]
    ]
  },
  {
    slug: "africa",
    name: "آفریقا",
    icon: "🌍",
    countries: [
      ["مصر", "Egypt", "🇪🇬", "Premier League", "egypt-premier-league", null], ["مراکش", "Morocco", "🇲🇦", "Botola Pro", "morocco-botola", null], ["آفریقای جنوبی", "South Africa", "🇿🇦", "Premier Soccer League", "south-africa-psl", null], ["الجزایر", "Algeria", "🇩🇿", "Ligue 1", "algeria-ligue-1", null], ["تونس", "Tunisia", "🇹🇳", "Ligue 1", "tunisia-ligue-1", null], ["نیجریه", "Nigeria", "🇳🇬", "NPFL", "nigeria-npfl", null], ["غنا", "Ghana", "🇬🇭", "Premier League", "ghana-premier-league", null], ["سنگال", "Senegal", "🇸🇳", "Ligue 1", "senegal-ligue-1", null], ["کامِرون", "Cameroon", "🇨🇲", "Elite One", "cameroon-elite-one", null], ["کنگو دموکراتیک", "Congo DR", "🇨🇩", "Linafoot", "dr-congo-linafoot", null]
    ]
  },
  {
    slug: "north-america",
    name: "آمریکای شمالی و مرکزی",
    icon: "🌎",
    countries: [
      ["آمریکا", "USA", "🇺🇸", "MLS", "mls", 253], ["مکزیک", "Mexico", "🇲🇽", "Liga MX", "liga-mx", 262], ["کانادا", "Canada", "🇨🇦", "Canadian Premier League", "canada-premier-league", null], ["کاستاریکا", "Costa Rica", "🇨🇷", "Primera División", "costa-rica-primera", null], ["هندوراس", "Honduras", "🇭🇳", "Liga Nacional", "honduras-liga-nacional", null], ["جامائیکا", "Jamaica", "🇯🇲", "Jamaica Premier League", "jamaica-premier-league", null], ["پاناما", "Panama", "🇵🇦", "LPF", "panama-lpf", null], ["گواتمالا", "Guatemala", "🇬🇹", "Liga Nacional", "guatemala-liga-nacional", null], ["السالوادور", "El Salvador", "🇸🇻", "Primera División", "el-salvador-primera", null], ["هائیتی", "Haiti", "🇭🇹", "Ligue Haïtienne", "haiti-ligue", null]
    ]
  },
  {
    slug: "south-america",
    name: "آمریکای جنوبی",
    icon: "🌎",
    countries: [
      ["برزیل", "Brazil", "🇧🇷", "Brasileirão Série A", "brasileirao", 71], ["آرژانتین", "Argentina", "🇦🇷", "Liga Profesional", "liga-profesional", 128], ["اروگوئه", "Uruguay", "🇺🇾", "Primera División", "uruguay-primera", null], ["کلمبیا", "Colombia", "🇨🇴", "Primera A", "colombia-primera", null], ["شیلی", "Chile", "🇨🇱", "Primera División", "chile-primera", null], ["اکوادور", "Ecuador", "🇪🇨", "Liga Pro", "ecuador-liga-pro", null], ["پاراگوئه", "Paraguay", "🇵🇾", "Primera División", "paraguay-primera", null], ["پرو", "Peru", "🇵🇪", "Liga 1", "peru-liga-1", null], ["بولیوی", "Bolivia", "🇧🇴", "Primera División", "bolivia-primera", null], ["ونزوئلا", "Venezuela", "🇻🇪", "Primera División", "venezuela-primera", null]
    ]
  },
  {
    slug: "oceania",
    name: "اقیانوسیه",
    icon: "🌊",
    countries: [
      ["استرالیا", "Australia", "🇦🇺", "A-League Men", "a-league", 188], ["نیوزیلند", "New Zealand", "🇳🇿", "National League", "new-zealand-national", null], ["فیجی", "Fiji", "🇫🇯", "National Football League", "fiji-national", null], ["جزایر سلیمان", "Solomon Islands", "🇸🇧", "S-League", "solomon-islands-sleague", null], ["تاهیتی", "Tahiti", "🇵🇫", "Ligue 1", "tahiti-ligue-1", null], ["کالدونیای جدید", "New Caledonia", "🇳🇨", "Super Ligue", "new-caledonia-super", null], ["پاپوآ گینه نو", "Papua New Guinea", "🇵🇬", "National Soccer League", "png-national", null], ["وانواتو", "Vanuatu", "🇻🇺", "Port Vila Premier League", "vanuatu-premier", null], ["ساموآ", "Samoa", "🇼🇸", "Samoa National League", "samoa-national", null], ["تونگا", "Tonga", "🇹🇴", "Tonga Major League", "tonga-major", null]
    ]
  }
].map((continent) => ({
  ...continent,
  countries: continent.countries.map(([name, apiCountry, flag, leagueName, slug, leagueId]) => ({ name, apiCountry, flag, leagueName, slug, leagueId, continent: continent.slug }))
}));

export const CONTINENT_BY_SLUG = Object.fromEntries(CONTINENTS.map((item) => [item.slug, item]));
export const LEAGUE_ENTRIES = CONTINENTS.flatMap((continent) => continent.countries);

export const CLUB_CUPS = [
  { name: "لیگ قهرمانان اروپا", slug: "ucl", country: "اروپا · باشگاهی", icon: "⭐", id: 2, continent: "europe" },
  { name: "لیگ اروپا", slug: "uefa-europa-league", country: "اروپا · باشگاهی", icon: "🏆", id: null, continent: "europe" },
  { name: "لیگ کنفرانس اروپا", slug: "uefa-conference-league", country: "اروپا · باشگاهی", icon: "🏅", id: null, continent: "europe" },
  { name: "لیگ قهرمانان آسیا نخبگان", slug: "afc-champions-league-elite", country: "آسیا · باشگاهی", icon: "👑", id: 17, continent: "asia" },
  { name: "لیگ قهرمانان آسیا ۲", slug: "afc-champions-league-two", country: "آسیا · باشگاهی", icon: "🏆", id: null, continent: "asia" },
  { name: "لیگ قهرمانان آفریقا", slug: "caf-champions-league", country: "آفریقا · باشگاهی", icon: "🌍", id: 12, continent: "africa" },
  { name: "جام کنفدراسیون آفریقا", slug: "caf-confederation-cup", country: "آفریقا · باشگاهی", icon: "🥇", id: null, continent: "africa" },
  { name: "کوپا لیبرتادورس", slug: "copa-libertadores", country: "آمریکای جنوبی · باشگاهی", icon: "🏆", id: 13, continent: "south-america" },
  { name: "کوپا سودامریکانا", slug: "copa-sudamericana", country: "آمریکای جنوبی · باشگاهی", icon: "🥈", id: null, continent: "south-america" },
  { name: "جام قهرمانان کونکاکاف", slug: "concacaf-champions-cup", country: "آمریکای شمالی و مرکزی · باشگاهی", icon: "🌎", id: 16, continent: "north-america" },
  { name: "لیگ قهرمانان اقیانوسیه", slug: "ofc-champions-league", country: "اقیانوسیه · باشگاهی", icon: "🌊", id: null, continent: "oceania" }
];

export const NATIONAL_TEAMS = CONTINENTS.flatMap((continent) => continent.countries.map((country) => ({ slug: country.slug, name: country.apiCountry, fa: country.name, flag: country.flag, continent: continent.slug })));
