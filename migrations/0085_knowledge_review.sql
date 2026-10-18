-- Bilik Mərkəzi: redaktor təsdiq axını və «Beh və ilkin ödəniş» bölməsi (#266, PRD v2 Modul 22).
ALTER TABLE "KnowledgeArticle" ADD COLUMN "submittedById" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "submittedAt" DATETIME;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "approvedById" TEXT;
ALTER TABLE "KnowledgeArticle" ADD COLUMN "approvedAt" DATETIME;
CREATE INDEX "KnowledgeArticle_status_reviewAfter_idx" ON "KnowledgeArticle"("status", "reviewAfter");

-- PRD 24.1 kateqoriyası. Bələdçi hüquqi yoxlamadan keçməyib — təsdiq gözləyir (IN_REVIEW), ictimai görünmür.
INSERT OR IGNORE INTO "KnowledgeCategory" ("id","slug","name","searchName","description","icon","order","isActive","createdAt","updatedAt") VALUES ('knowledge_category_beh-ilkin-odenis','beh-ilkin-odenis','Beh və ilkin ödəniş','beh ve ilkin odenis','Alqı-satqı və kirayədə beh, avans və ilkin ödəniş: fərqləri, yazılı razılaşma, qəbz və dələduzluq riskləri.','Wallet',12,1,'2026-10-18T08:00:00.000Z','2026-10-18T08:00:00.000Z');
INSERT OR IGNORE INTO "KnowledgeArticle" ("id","slug","title","searchText","excerpt","content","categoryId","audience","level","status","legalStatus","riskLevel","jurisdiction","legalActs","sourceUrls","readMinutes","isFeatured","viewCount","isDemo","coverAlt","tags","submittedAt","createdAt","updatedAt") VALUES ('knowledge_article_beh-ve-ilkin-odenis','beh-ve-ilkin-odenis-tehlukesiz-nece-verilir','Beh və ilkin ödəniş: təhlükəsiz necə verilir','beh ve ilkin odenis: tehlukesiz nece verilir beh ile avans arasindaki ferq, razilasmanin yazili resmilesdirilmesi, odenisin subutu ve saxta elanlarda en cox rast gelinen beh telebi sxemleri. beh nedir ve ne ucun verilir beh muqavile baglanacagina teminat kimi tereflerden birinin digerine odediyi pul meblegidir. alqi-satqida adeten alici saticiya, kirayede ise kirayeci ev sahibine verir. behin huquqi neticeleri mulki mecelle ile tenzimlenir; razilasmanin mezmunu ve sertleri tereflerin yazili senedinde aydin gosterilmelidir. beh, avans ve ilkin odenis ferqlidir beh — muqavilenin icrasini temin edir; tereflerden biri razilasmani pozduqda neticeleri qanunla ve muqavile ile mueyyen olunur. avans — gelecek odenisin bir hissesidir ve adeten teminat funksiyasi dasimir; sovdelesme bas tutmasa geri qaytarilmasi gozlenilir. ilkin odenis — ipoteka ve ya hisse-hisse odenisde qiymetin ilk hissesidir, esas muqavilenin sertlerine tabedir. senedde odenisin hansi nov oldugu aciq yazilmayanda mubahise zamani onun nece qiymetlendirileceyi qeyri-mueyyen olur. ona gore «beh», «avans» ve ya «ilkin odenis» sozunu senedde deqiq isledin. pul vermezden evvel yoxlayin saticinin ve ya ev sahibinin emlakin mulkiyyetcisi oldugunu cixaris (reyestr melumati) ile yoxlayin; ad sexsiyyet vesiqesi ile uygun gelmelidir. emlak uzerinde ipoteka, hebs ve ya diger mehdudiyyetin olub-olmadigini oyrenin. emlaki sexsen gormeden ve mulkiyyetci ile gorusmeden beh vermeyin. vasiteci (agent) istirak edirse, onun kimin adindan cixis etdiyini ve selahiyyetini yazili sorusun. razilasmani nece resmilesdirmek lazimdir beh barede razilasmani yazili baglayin: tereflerin adlari, emlakin unvani ve qeydiyyat melumati, mebleg, esas muqavilenin baglanacagi son tarix ve razilasma pozulduqda neticeler. mumkun olduqda notariusa muraciet edin — notarius tereflerin sexsiyyetini ve mulkiyyet huququnu yoxlayir. pulu bank kocurmesi ile odeyin ve ya imzali qebz alin; qebzde mebleg, tarix, odenisin teyinati ve alanin imzasi olmalidir. deleduzluq siqnallari emlaki gormeden «yer saxlamaq ucun» tecili beh ve ya on odenis telebi. pulun kart nomresine, elektron pul kisesine ve ya ucuncu sexse kocurulmesinin istenmesi. bazar qiymetinden xeyli asagi qiymet ve «basqa alici da var» tezyiqi. mulkiyyetcinin ozunun goruse gelmemesi, senedlerin yalniz fotosekille gosterilmesi. saytda bele bir teleble qarsilassaniz, elanin sehifesindeki «elandan sikayet et» duymesi ile bize bildirin. bu beledci umumi melumat xarakteri dasiyir ve huquqi mesleheti evez etmir; konkret sovdelesmeden evvel notarius ve ya huquqsunasla meslehetlesin. beh avans ilkin odenis deleduzluq beh ve ilkin odenis mulki mecelle «notariat haqqinda» qanun','Beh ilə avans arasındakı fərq, razılaşmanın yazılı rəsmiləşdirilməsi, ödənişin sübutu və saxta elanlarda ən çox rast gəlinən beh tələbi sxemləri.','<h2>Beh nədir və nə üçün verilir</h2>
<p>Beh müqavilə bağlanacağına təminat kimi tərəflərdən birinin digərinə ödədiyi pul məbləğidir. Alqı-satqıda adətən alıcı satıcıya, kirayədə isə kirayəçi ev sahibinə verir. Behin hüquqi nəticələri Mülki Məcəllə ilə tənzimlənir; razılaşmanın məzmunu və şərtləri tərəflərin yazılı sənədində aydın göstərilməlidir.</p>
<h2>Beh, avans və ilkin ödəniş fərqlidir</h2>
<ul>
<li><strong>Beh</strong> — müqavilənin icrasını təmin edir; tərəflərdən biri razılaşmanı pozduqda nəticələri qanunla və müqavilə ilə müəyyən olunur.</li>
<li><strong>Avans</strong> — gələcək ödənişin bir hissəsidir və adətən təminat funksiyası daşımır; sövdələşmə baş tutmasa geri qaytarılması gözlənilir.</li>
<li><strong>İlkin ödəniş</strong> — ipoteka və ya hissə-hissə ödənişdə qiymətin ilk hissəsidir, əsas müqavilənin şərtlərinə tabedir.</li>
</ul>
<p>Sənəddə ödənişin hansı növ olduğu açıq yazılmayanda mübahisə zamanı onun necə qiymətləndiriləcəyi qeyri-müəyyən olur. Ona görə «beh», «avans» və ya «ilkin ödəniş» sözünü sənəddə dəqiq işlədin.</p>
<h2>Pul verməzdən əvvəl yoxlayın</h2>
<ul>
<li>Satıcının və ya ev sahibinin əmlakın mülkiyyətçisi olduğunu çıxarış (reyestr məlumatı) ilə yoxlayın; ad şəxsiyyət vəsiqəsi ilə uyğun gəlməlidir.</li>
<li>Əmlak üzərində ipoteka, həbs və ya digər məhdudiyyətin olub-olmadığını öyrənin.</li>
<li>Əmlakı şəxsən görmədən və mülkiyyətçi ilə görüşmədən beh verməyin.</li>
<li>Vasitəçi (agent) iştirak edirsə, onun kimin adından çıxış etdiyini və səlahiyyətini yazılı soruşun.</li>
</ul>
<h2>Razılaşmanı necə rəsmiləşdirmək lazımdır</h2>
<ul>
<li>Beh barədə razılaşmanı yazılı bağlayın: tərəflərin adları, əmlakın ünvanı və qeydiyyat məlumatı, məbləğ, əsas müqavilənin bağlanacağı son tarix və razılaşma pozulduqda nəticələr.</li>
<li>Mümkün olduqda notariusa müraciət edin — notarius tərəflərin şəxsiyyətini və mülkiyyət hüququnu yoxlayır.</li>
<li>Pulu bank köçürməsi ilə ödəyin və ya imzalı qəbz alın; qəbzdə məbləğ, tarix, ödənişin təyinatı və alanın imzası olmalıdır.</li>
</ul>
<h2>Dələduzluq siqnalları</h2>
<ul>
<li>Əmlakı görmədən «yer saxlamaq üçün» təcili beh və ya ön ödəniş tələbi.</li>
<li>Pulun kart nömrəsinə, elektron pul kisəsinə və ya üçüncü şəxsə köçürülməsinin istənməsi.</li>
<li>Bazar qiymətindən xeyli aşağı qiymət və «başqa alıcı da var» təzyiqi.</li>
<li>Mülkiyyətçinin özünün görüşə gəlməməsi, sənədlərin yalnız fotoşəkillə göstərilməsi.</li>
</ul>
<p>Saytda belə bir tələblə qarşılaşsanız, elanın səhifəsindəki «Elandan şikayət et» düyməsi ilə bizə bildirin. Bu bələdçi ümumi məlumat xarakteri daşıyır və hüquqi məsləhəti əvəz etmir; konkret sövdələşmədən əvvəl notarius və ya hüquqşünasla məsləhətləşin.</p>',(SELECT "id" FROM "KnowledgeCategory" WHERE "slug" = 'beh-ilkin-odenis'),'BUYER','BEGINNER','IN_REVIEW','CURRENT','LEGAL_REVIEW','Azərbaycan Respublikası','["Mülki Məcəllə", "«Notariat haqqında» Qanun"]','["https://e-qanun.az/framework/46944", "https://e-qanun.az/framework/107", "https://emlak.gov.az/az"]',2,0,0,0,'','["Beh", "Avans", "İlkin ödəniş", "Dələduzluq"]','2026-10-18T08:00:00.000Z','2026-10-18T08:00:00.000Z','2026-10-18T08:00:00.000Z');
