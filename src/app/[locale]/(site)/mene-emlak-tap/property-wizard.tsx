"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { DOCUMENT_STATUS_LABELS, LISTING_TYPE_LABELS, RENOVATION_LABELS } from "@/lib/constants";

type Option = { value: string; label: string };
type CityOption = Option & { districts: Option[] };

export function PropertyWizard({ types, cities }: { types: Option[]; cities: CityOption[] }) {
  const t = useTranslations("phase2.wizard");
  const router = useRouter();
  const [city, setCity] = useState("");
  const districts = useMemo(() => cities.find((item) => item.value === city)?.districts ?? [], [cities, city]);
  const fieldClass = "mt-1 min-h-12 w-full rounded-xs border border-line-strong bg-paper px-3 text-sm text-ink";

  function submit(formData: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      if (typeof value === "string" && value) params.append(key, value);
    }
    router.push(`/emlaklar?${params.toString()}`);
  }

  return (
    <form action={submit} className="rounded-md border border-line bg-paper p-5 sm:p-7">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm text-ink-soft">1. {t("saleRent")}<select name="elan" className={fieldClass}><option value="">{t("any")}</option>{Object.entries(LISTING_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">2. {t("propertyType")}<select name="tip" className={fieldClass}><option value="">{t("any")}</option>{types.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">3. {t("city")}<select name="seher" value={city} onChange={(event) => setCity(event.target.value)} className={fieldClass}><option value="">{t("any")}</option>{cities.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">4. {t("district")}<select name="rayon" className={fieldClass} disabled={!city}><option value="">{t("any")}</option>{districts.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">5. {t("rooms")}<select name="otaq" className={fieldClass}><option value="">{t("any")}</option>{[1,2,3,4,5].map((room) => <option key={room} value={room}>{room === 5 ? "5+" : room}</option>)}</select></label>
        <label className="text-sm text-ink-soft">6. {t("minPrice")}<input name="min" type="number" min="0" step="1000" className={fieldClass} /></label>
        <label className="text-sm text-ink-soft">7. {t("maxPrice")}<input name="max" type="number" min="0" step="1000" className={fieldClass} /></label>
        <label className="text-sm text-ink-soft">8. {t("minArea")}<input name="sahe_min" type="number" min="0" step="5" className={fieldClass} /></label>
        <label className="text-sm text-ink-soft">9. {t("renovation")}<select name="temir" className={fieldClass}><option value="">{t("any")}</option>{Object.entries(RENOVATION_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">10. {t("document")}<select name="sened" className={fieldClass}><option value="">{t("any")}</option>{Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="text-sm text-ink-soft">11. {t("mortgage")}<select name="xususiyyet" className={fieldClass}><option value="">{t("any")}</option><option value="ipoteka">Bəli</option></select></label>
        <label className="text-sm text-ink-soft">12. {t("priority")}<select name="siralama" className={fieldClass}><option value="newest">Ən yeni</option><option value="price_asc">Ən uyğun qiymət</option><option value="area_desc">Ən geniş sahə</option><option value="featured">Premium seçimlər</option></select></label>
      </div>
      <button type="submit" className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xs bg-gold px-6 text-sm font-medium text-ink transition-colors hover:bg-gold-soft">{t("submit")}</button>
    </form>
  );
}
