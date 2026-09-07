alter table public.fot10_golden10_catalog
  add column if not exists country text;

alter table public.fot10_golden10_catalog
  add column if not exists team_type text;

alter table public.fot10_golden10_catalog
  drop constraint if exists fot10_golden10_catalog_team_type_check;

alter table public.fot10_golden10_catalog
  add constraint fot10_golden10_catalog_team_type_check
  check (team_type in ('national', 'club'));

create index if not exists idx_fot10_catalog_country
  on public.fot10_golden10_catalog(country);

create index if not exists idx_fot10_catalog_team_type
  on public.fot10_golden10_catalog(team_type);

update public.fot10_golden10_catalog
set country = case team_name
  when 'آث میلان' then 'ایتالیا'
  when 'آرسنال' then 'انگلیس'
  when 'آژاکس' then 'هلند'
  when 'آمریکا' then 'آمریکا'
  when 'آیندهوون' then 'هلند'
  when 'الهلال' then 'عربستان سعودی'
  when 'اینتر' then 'ایتالیا'
  when 'اینتر میامی' then 'آمریکا'
  when 'بارسلونا' then 'اسپانیا'
  when 'بایرن مونیخ' then 'آلمان'
  when 'بلژیک' then 'بلژیک'
  when 'بوروسیا دورتموند' then 'آلمان'
  when 'بوکاجونیورز' then 'آرژانتین'
  when 'پاری سن ژرمن' then 'فرانسه'
  when 'پرتغال' then 'پرتغال'
  when 'پرسپولیس' then 'ایران'
  when 'پرو' then 'پرو'
  when 'تاتنهام' then 'انگلیس'
  when 'چلسی' then 'انگلیس'
  when 'دانمارک' then 'دانمارک'
  when 'رئال مادرید' then 'اسپانیا'
  when 'رم' then 'ایتالیا'
  when 'رومانی' then 'رومانی'
  when 'ریورپلاته' then 'آرژانتین'
  when 'ژاپن' then 'ژاپن'
  when 'سانتوس' then 'برزیل'
  when 'شیلی' then 'شیلی'
  when 'غنا' then 'غنا'
  when 'فلامینگو' then 'برزیل'
  when 'فرانسه' then 'فرانسه'
  when 'کرواسی' then 'کرواسی'
  when 'کلمبیا' then 'کلمبیا'
  when 'لیورپول' then 'انگلیس'
  when 'مجارستان' then 'مجارستان'
  when 'مکزیک' then 'مکزیک'
  when 'منچسترسیتی' then 'انگلیس'
  when 'منچستریونایتد' then 'انگلیس'
  when 'ناپولی' then 'ایتالیا'
  when 'نیجریه' then 'نیجریه'
  when 'هلند' then 'هلند'
  when 'ویارئال' then 'اسپانیا'
  when 'یوونتوس' then 'ایتالیا'
  when 'آرژانتین' then 'آرژانتین'
  when 'برزیل' then 'برزیل'
  when 'ایران' then 'ایران'
  when 'ایتالیا' then 'ایتالیا'
  when 'اسپانیا' then 'اسپانیا'
  when 'آلمان' then 'آلمان'
  when 'انگلیس' then 'انگلیس'
  else country
end,
team_type = case
  when team_name in ('آرژانتین','برزیل','فرانسه','ایتالیا','اسپانیا','آلمان','انگلیس','هلند','پرتغال','بلژیک','کرواسی','اروگوئه','مکزیک','کلمبیا','شیلی','ژاپن','ایران','آمریکا','دانمارک','پرو','رومانی','مجارستان','غنا','نیجریه') then 'national'
  else 'club'
end;
