# Təhlükəsizlik siyasəti

Luxe Home Estate təhlükəsizlik zəifliklərinin məsuliyyətli və məxfi şəkildə bildirilməsini dəstəkləyir. Real istifadəçi və ya production məlumatına təsir edə biləcək problemi açıq GitHub issue, discussion, sosial şəbəkə paylaşımı və ya pull request kimi dərc etməyin.

## Dəstəklənən versiyalar

Layihə hələ semantik release seriyası yayımlamır. Təhlükəsizlik yeniləmələri yalnız canlı production deploy-un əsaslandığı cari `main` branch-i üçün hazırlanır.

| Versiya | Dəstək |
|---|---:|
| Cari production / `main` | ✅ Dəstəklənir |
| Köhnə commit, branch və şəxsi fork | ❌ Dəstəklənmir |

## Zəifliyin bildirilməsi

Hesabatı [muradofftehmez01@gmail.com](mailto:muradofftehmez01@gmail.com) ünvanına göndərin.

Mövzu sətrində `Luxe Home Estate təhlükəsizlik hesabatı` yazın və mümkün olduqda aşağıdakı məlumatları əlavə edin:

- zəifliyin qısa təsviri və təsir etdiyi URL, komponent və ya commit;
- təsirin məxfiliyə, bütövlüyə və əlçatanlığa nəticəsi;
- problemi təkrar yaratmaq üçün minimum addımlar;
- təhlükəsiz sübut, request/response nümunəsi və ya ekran görüntüsü;
- istismar üçün tələb olunan hesab növü və şərtlər;
- mümkün həll və ya risk azaltma təklifi;
- sizinlə təhlükəsiz əlaqə üsulu və adınızın açıqlanması barədə seçiminiz.

Secret, parol, sessiya cookie-si və şəxsi məlumatı hesabatın mətninə əlavə etməyin. Lazım olarsa əvvəlcə əlaqə yaradın və təhlükəsiz ötürmə üsulunu razılaşdırın.

## Cavab prosesi

Normal halda:

1. Hesabatın alındığı 3 iş günü ərzində təsdiqlənir.
2. İlkin təsir və təkrarlanma yoxlaması 7 iş günü ərzində aparılır.
3. Qəbul edilmiş hesabat üçün prioritet, müvəqqəti risk azaltma və düzəliş planı paylaşılır.
4. Həll prosesi uzanarsa ən azı hər 14 gündə status yenilənir.
5. Düzəliş production-a yayıldıqdan və yoxlandıqdan sonra hesabat bağlanır.

Bu müddətlər hədəfdir; kritik insident, üçüncü tərəf asılılığı və ya koordinasiyalı açıqlama əlavə vaxt tələb edə bilər.

## Əhatə dairəsi

Əhatə dairəsinə daxildir:

- `https://luxehomeestate.az` və `https://www.luxehomeestate.az`;
- bu repozitoriyadakı Next.js tətbiqi, Server Actions və Route Handler-lar;
- əməkdaş və ictimai hesab autentifikasiyası;
- rol/icazə yoxlamaları, sessiyalar və TOTP axını;
- Cloudflare D1, R2 və Images ilə tətbiq səviyyəli inteqrasiya;
- media upload və public media delivery;
- istifadəçiyə aid elan, profil, müraciət və media məlumatlarının icazə sərhədləri.

Əhatə dairəsindən kənardır:

- Cloudflare, GitHub, Resend və digər üçüncü tərəf platformalarının öz xidmətlərindəki zəifliklər;
- sosial mühəndislik, spam, fiziki təhlükəsizlik və əməkdaşların aldadılması;
- əvvəlcədən razılaşdırılmamış denial-of-service, brute-force və yüksək həcmli avtomatlaşdırılmış test;
- real istifadəçi məlumatının çıxarılması, dəyişdirilməsi və ya silinməsi;
- açıq mənbələrdən şirkət və əməkdaş məlumatlarının toplanması;
- yalnız köhnə, dəstəklənməyən commit və ya şəxsi fork-da mövcud problem.

Üçüncü tərəf xidmətində zəiflik tapsanız, həmin provayderin təhlükəsizlik proqramına müraciət edin. Problem Luxe Home Estate konfiqurasiyasından qaynaqlanırsa, bu siyasət üzrə bildirin.

## Təhlükəsiz araşdırma qaydaları

- Yalnız öz hesabınızdan və öz yaratdığınız məlumatdan istifadə edin.
- Zəifliyi sübut etmək üçün lazım olan minimum məlumatı oxuyun və minimum sorğu göndərin.
- Davamlı giriş, gizli kanal, zərərli fayl və ya production məlumatında dəyişiklik yaratmayın.
- Başqa istifadəçinin məlumatına çıxış əldə etsəniz dərhal dayanın, məlumatı saxlamayın və hesabat göndərin.
- Avtomatlaşdırılmış skan və yük testi üçün əvvəlcədən yazılı razılıq alın.
- Düzəliş yayımlanmadan və açıqlama vaxtı razılaşdırılmadan texniki detalları ictimailəşdirməyin.

Bu qaydalara vicdanla əməl edən təhlükəsizlik tədqiqatçılarına qarşı yalnız araşdırma fəaliyyətinə görə hüquqi tədbir başlatmamaq niyyətindəyik. Bu bəyanat üçüncü tərəflərin fəaliyyəti və hüquqları barədə təminat vermir.

## Layihənin təhlükəsizlik bazası

Hazırkı müdafiələrə aşağıdakılar daxildir:

- əməkdaş hesabları üçün məcburi TOTP 2FA və birdəfəlik backup kodlar;
- PBKDF2-HMAC-SHA256 parol hash-i və giriş zamanı parametr yeniləmə imkanı;
- D1-də saxlanan, revoke edilə bilən və müddəti məhdud sessiyalar;
- ictimai və əməkdaş auth növlərinin sərt ayrılması;
- hesab kilidi, IP login limit-i və admin mutation rate limit-i;
- hər admin yazısında canlı sessiya, rol/icazə və same-origin yoxlaması;
- HTML sanitizasiyası və audit jurnalı;
- media üçün ölçü, format və magic-byte yoxlaması, təhlükəsiz R2 açarı və SVG qadağası;
- admin route-larında CSP, `no-store`, clickjacking və referrer müdafiəsi;
- staging mühitində `noindex` və production resurslarından ayrı D1/R2 namespace-ləri.

Məlum təhlükəsizlik boşluqları və planlaşdırılan möhkəmləndirmələr README və Wiki-də açıq şəkildə qeyd olunur. Xüsusilə əlaqə formasının anti-spam qatı, e-poçt təsdiqi, parol bərpası, CI və browser E2E testləri hələ tamamlanmayıb.

## Açıqlama və təşəkkür

İctimai açıqlama yalnız düzəliş production-a yayıldıqdan və vaxt hər iki tərəflə razılaşdırıldıqdan sonra edilməlidir. İstəyiniz və razılığınız olduqda adınız release qeydi və ya təhlükəsizlik təşəkkür siyahısında göstərilə bilər.

## Sahiblik

Proqram kodunun müəllif hüquqları **Təhməz Muradova** məxsusdur. **Luxe Home Estate MMC**, “Luxe Home Estate” brendi və markası **Əmiyev Bahadur Qafar oğluna** məxsusdur.
