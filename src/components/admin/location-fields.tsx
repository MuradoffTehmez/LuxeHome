"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Input, Select } from "@/components/ui/field";
import { LOCATION_KINDS, type Locale } from "@/lib/constants";
import { REGIONS, regionForCitySlug, type RegionKey } from "@/lib/regions";
import { OFFICIAL_STREET_CODES } from "@/lib/official-street-codes";
import { normalizeSearchText } from "@/lib/search-normalization";
import { useFieldError } from "./form-shell";
import { FullWidth } from "./form-fields";

export type LocationFieldPlace = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  parentId: string | null;
  /** Kök şəhər/rayon — Bakı qəsəbələrində babadır (`withCityAndGroup`). */
  cityId: string | null;
  group?: string | null;
  /** Rəsmi kod (Ünvan Reyestri) — küçə təkliflərinin faylını seçir. */
  officialCode?: string | null;
};

/** Metro stansiyası və ya nişangah — valideyni şəhərdir. */
export type LocationFieldOption = {
  id: string;
  name: string;
  parentId: string | null;
};

export type LocationFieldsLabels = {
  region: string;
  allRegions: string;
  city: string;
  urbanDistrict: string;
  settlement: string;
  village: string;
  neighborhood: string;
  neighborhoodHint: string;
  street: string;
  streetHint: string;
  building: string;
  buildingHint: string;
  select: string;
  notSelected: string;
  metro: string;
  landmark: string;
  landmarkHint: string;
  streetOfficialHint: string;
};

export type LocationFieldsInitial = {
  cityId: string;
  districtId: string | null;
  street?: string | null;
  building?: string | null;
  neighborhoodName?: string | null;
  /** Köhnə elanın sərbəst ünvanı — yeni sahələr boşdursa küçə sahəsinə düşür. */
  address?: string | null;
  metroId?: string | null;
  landmarkId?: string | null;
};

type Props = {
  cities: ReadonlyArray<{ id: string; name: string; slug: string; officialCode?: string | null }>;
  places: ReadonlyArray<LocationFieldPlace>;
  /** Verilməsə metro/nişangah sahəsi göstərilmir. */
  metros?: ReadonlyArray<LocationFieldOption>;
  landmarks?: ReadonlyArray<LocationFieldOption>;
  locale: Locale;
  labels: LocationFieldsLabels;
  initial: LocationFieldsInitial;
  /** Metro və şəkil adı kimi yerdən asılı başqa sahələr üçün. */
  onChange?: (value: { cityId: string; districtId: string }) => void;
};

function initialState(initial: LocationFieldsInitial, places: Props["places"], cities: Props["cities"]) {
  const byId = new Map(places.map((place) => [place.id, place]));
  const leaf = initial.districtId ? byId.get(initial.districtId) : undefined;
  const parent = leaf?.parentId ? byId.get(leaf.parentId) : undefined;
  const city = cities.find((item) => item.id === initial.cityId);
  const hasNewFields = Boolean(initial.street || initial.building);

  return {
    region: (city ? regionForCitySlug(city.slug)?.key : undefined) ?? "",
    cityId: initial.cityId,
    urbanId:
      leaf?.kind === LOCATION_KINDS.DISTRICT
        ? leaf.id
        : parent?.kind === LOCATION_KINDS.DISTRICT
          ? parent.id
          : "",
    settlementId: leaf?.kind === LOCATION_KINDS.SETTLEMENT ? leaf.id : "",
    villageId: leaf?.kind === LOCATION_KINDS.VILLAGE ? leaf.id : "",
    neighborhood: leaf?.kind === LOCATION_KINDS.NEIGHBORHOOD ? leaf.name : (initial.neighborhoodName ?? ""),
    street: hasNewFields ? (initial.street ?? "") : (initial.address ?? ""),
    building: initial.building ?? "",
    metroId: initial.metroId ?? "",
    landmarkId: initial.landmarkId ?? "",
  };
}

/**
 * Seçimdən yuxarı qalxaraq küçə faylı olan ilk rəsmi vahidi tapır: massivin kodu
 * yoxdur, Bakının kök kodunun isə faylı — küçələr rayon və qəsəbə səviyyəsindədir.
 */
function officialCodeFor(
  places: Props["places"],
  cities: Props["cities"],
  leafId: string,
  cityId: string,
): string | null {
  const byId = new Map(places.map((place) => [place.id, place]));
  for (let place = byId.get(leafId); place; place = place.parentId ? byId.get(place.parentId) : undefined) {
    if (place.officialCode && OFFICIAL_STREET_CODES.has(place.officialCode)) return place.officialCode;
  }
  const cityCode = cities.find((city) => city.id === cityId)?.officialCode;
  return cityCode && OFFICIAL_STREET_CODES.has(cityCode) ? cityCode : null;
}

/** Rəsmi küçə siyahısı hər vahid üçün statik fayldır; sessiya boyu bir dəfə yüklənir. */
const streetCache = new Map<string, Promise<string[]>>();

function loadOfficialStreets(code: string): Promise<string[]> {
  let pending = streetCache.get(code);
  if (!pending) {
    pending = fetch(`/data/kuceler/${code}.json`)
      .then((response) => (response.ok ? (response.json() as Promise<string[]>) : []))
      .catch(() => []);
    streetCache.set(code, pending);
  }
  return pending;
}

/**
 * İyerarxik ünvan sahələri: Region → Şəhər/rayon → Şəhər rayonu → Qəsəbə →
 * Kənd → Məhəllə → Küçə → Bina.
 *
 * Hər pillə əvvəlkinə görə süzülür və variantı olmayan pillə gizlənir (Qubada
 * şəhər rayonu yoxdur, Bakıda kənd yoxdur). Bazaya bir yer yazılır — ağacdakı
 * ən dərin seçim (`districtId`); tam yol valideynlərdən bərpa olunur
 * (`location-path.ts`). Qəsəbə, kənd və massiv eyni pillədədir, ona görə biri
 * seçiləndə digər ikisi sıfırlanır.
 *
 * Metro və nişangah şəhərə bağlı ayrıca sahələrdir (`metroId`, `landmarkId`).
 * Küçə sahəsi rəsmi Ünvan Reyestrinin siyahısını təklif edir, amma sərbəst
 * mətn kimi qalır — reyestr hər yeni küçəni dərhal əks etdirmir.
 *
 * Massiv sahəsi sərbəst mətndir və siyahıdakı adları təklif edir: ad siyahıdakı
 * ilə üst-üstə düşürsə qeydə bağlanır, düşmürsə `neighborhoodName` kimi saxlanılır
 * — ağacdakı massiv siyahısı tam deyil.
 */
export function LocationFields({ cities, places, metros, landmarks, locale, labels, initial, onChange }: Props) {
  const [state, setState] = useState(() => initialState(initial, places, cities));
  const datalistId = useId();
  const districtError = useFieldError("districtId");
  const cityError = useFieldError("cityId");
  const streetError = useFieldError("street");
  const buildingError = useFieldError("building");
  const landmarkError = useFieldError("landmarkId");
  const streetListId = useId();
  const [streets, setStreets] = useState<string[]>([]);

  const regions = useMemo(() => {
    const present = new Set(cities.map((city) => regionForCitySlug(city.slug)?.key).filter(Boolean));
    return REGIONS.filter((region) => present.has(region.key));
  }, [cities]);

  const cityOptions = useMemo(
    () =>
      cities
        .filter((city) => !state.region || regionForCitySlug(city.slug)?.key === state.region)
        .map((city) => ({ value: city.id, label: city.name })),
    [cities, state.region],
  );

  const scoped = (kind: string) =>
    places.filter(
      (place) =>
        place.kind === kind &&
        (state.urbanId ? place.parentId === state.urbanId : place.cityId === state.cityId),
    );

  const urbanOptions = places.filter(
    (place) => place.kind === LOCATION_KINDS.DISTRICT && place.parentId === state.cityId,
  );
  const settlementOptions = scoped(LOCATION_KINDS.SETTLEMENT);
  const villageOptions = scoped(LOCATION_KINDS.VILLAGE);
  const neighborhoodOptions = scoped(LOCATION_KINDS.NEIGHBORHOOD);

  const neighborhoodMatch = state.neighborhood.trim()
    ? neighborhoodOptions.find(
        (place) => normalizeSearchText(place.name) === normalizeSearchText(state.neighborhood),
      )
    : undefined;
  const leafFromNeighborhood = !state.settlementId && !state.villageId ? neighborhoodMatch : undefined;
  const districtId =
    state.settlementId || state.villageId || leafFromNeighborhood?.id || state.urbanId || "";
  const neighborhoodName = leafFromNeighborhood ? "" : state.neighborhood.trim();

  useEffect(() => {
    onChange?.({ cityId: state.cityId, districtId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnız dəyər dəyişəndə
  }, [state.cityId, districtId]);

  // Küçə təklifləri ən dərin rəsmi vahidin kodu ilə seçilir: qəsəbə/kənd öz
  // kodunu, massiv valideyn rayonun kodunu, rayonsuz şəhər isə öz kodunu verir.
  const streetCode = officialCodeFor(places, cities, districtId, state.cityId);

  useEffect(() => {
    let active = true;
    if (!streetCode) {
      setStreets([]);
      return;
    }
    void loadOfficialStreets(streetCode).then((names) => {
      if (active) setStreets(names);
    });
    return () => {
      active = false;
    };
  }, [streetCode]);

  const metroOptions = (metros ?? []).filter((metro) => metro.parentId === state.cityId);
  const landmarkOptions = (landmarks ?? []).filter((landmark) => landmark.parentId === state.cityId);

  const toOptions = (items: LocationFieldPlace[], withGroup: boolean) =>
    items.map((place) => ({
      value: place.id,
      label: place.name,
      group: withGroup ? (place.group ?? null) : null,
    }));

  function selectCity(cityId: string) {
    setState((current) => ({
      ...current,
      cityId,
      urbanId: "",
      settlementId: "",
      villageId: "",
      neighborhood: "",
      // Metro və nişangah şəhərə bağlıdır — başqa şəhərdə qalsaydı server rədd edərdi.
      metroId: "",
      landmarkId: "",
    }));
  }

  function selectRegion(region: string) {
    const keepCity = cities.some(
      (city) => city.id === state.cityId && (!region || regionForCitySlug(city.slug)?.key === region),
    );
    setState((current) => ({ ...current, region: region as RegionKey | "" }));
    if (!keepCity) {
      // Regionda tək şəhər varsa (Bakı) o dərhal seçilir.
      const inRegion = cities.filter((city) => regionForCitySlug(city.slug)?.key === region);
      selectCity(inRegion.length === 1 ? inRegion[0].id : "");
    }
  }

  /** Qəsəbə/kənd seçiləndə şəhər rayonu boşdursa valideyndən doldurulur. */
  function selectLeaf(kind: "settlementId" | "villageId", id: string) {
    const place = places.find((item) => item.id === id);
    const parent = place?.parentId ? places.find((item) => item.id === place.parentId) : undefined;
    setState((current) => {
      const changed = current[kind] !== id;
      return {
        ...current,
        settlementId: kind === "settlementId" ? id : "",
        villageId: kind === "villageId" ? id : "",
        urbanId: parent?.kind === LOCATION_KINDS.DISTRICT ? parent.id : current.urbanId,
        // Massiv əvvəlki yerə aid idi — saxlanılsaydı yeni qəsəbə/kəndin altında sərbəst
        // `neighborhoodName` kimi gedər və qarışıq ünvan yazılardı.
        neighborhood: changed ? "" : current.neighborhood,
      };
    });
  }

  return (
    <>
      <input type="hidden" name="districtId" value={districtId} />
      <input type="hidden" name="neighborhoodName" value={neighborhoodName} />

      {regions.length > 1 && (
        <Select
          label={labels.region}
          value={state.region}
          onChange={(event) => selectRegion(event.target.value)}
          placeholder={labels.allRegions}
          options={regions.map((region) => ({ value: region.key, label: region.names[locale] }))}
        />
      )}

      <Select
        name="cityId"
        label={labels.city}
        required
        value={state.cityId}
        error={cityError}
        onChange={(event) => selectCity(event.target.value)}
        placeholder={labels.select}
        options={cityOptions}
      />

      {urbanOptions.length > 0 && (
        <Select
          label={labels.urbanDistrict}
          value={state.urbanId}
          error={districtError}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              urbanId: event.target.value,
              settlementId: "",
              villageId: "",
              neighborhood: "",
            }))
          }
          placeholder={labels.notSelected}
          options={toOptions(urbanOptions, false)}
        />
      )}

      {settlementOptions.length > 0 && (
        <Select
          label={labels.settlement}
          value={state.settlementId}
          onChange={(event) => selectLeaf("settlementId", event.target.value)}
          placeholder={labels.notSelected}
          options={toOptions(settlementOptions, !state.urbanId)}
        />
      )}

      {villageOptions.length > 0 && (
        <Select
          label={labels.village}
          value={state.villageId}
          onChange={(event) => selectLeaf("villageId", event.target.value)}
          placeholder={labels.notSelected}
          options={toOptions(villageOptions, false)}
        />
      )}

      <div>
        <Input
          label={labels.neighborhood}
          value={state.neighborhood}
          maxLength={120}
          list={neighborhoodOptions.length > 0 ? datalistId : undefined}
          hint={labels.neighborhoodHint}
          onChange={(event) => setState((current) => ({ ...current, neighborhood: event.target.value }))}
        />
        {neighborhoodOptions.length > 0 && (
          <datalist id={datalistId}>
            {neighborhoodOptions.map((place) => (
              <option key={place.id} value={place.name} />
            ))}
          </datalist>
        )}
      </div>

      {!urbanOptions.length && districtError ? (
        <p className="text-sm text-danger sm:col-span-2">{districtError}</p>
      ) : null}

      {metroOptions.length > 0 && (
        <Select
          name="metroId"
          label={labels.metro}
          value={state.metroId}
          onChange={(event) => setState((current) => ({ ...current, metroId: event.target.value }))}
          placeholder={labels.notSelected}
          options={metroOptions.map((metro) => ({ value: metro.id, label: metro.name }))}
        />
      )}

      {landmarkOptions.length > 0 && (
        <Select
          name="landmarkId"
          label={labels.landmark}
          hint={labels.landmarkHint}
          value={state.landmarkId}
          error={landmarkError}
          onChange={(event) => setState((current) => ({ ...current, landmarkId: event.target.value }))}
          placeholder={labels.notSelected}
          options={landmarkOptions.map((landmark) => ({ value: landmark.id, label: landmark.name }))}
        />
      )}

      <FullWidth>
        <Input
          name="street"
          label={labels.street}
          value={state.street}
          maxLength={160}
          list={streets.length > 0 ? streetListId : undefined}
          hint={streets.length > 0 ? `${labels.streetHint} ${labels.streetOfficialHint}` : labels.streetHint}
          error={streetError}
          onChange={(event) => setState((current) => ({ ...current, street: event.target.value }))}
        />
        {streets.length > 0 && (
          <datalist id={streetListId}>
            {streets.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        )}
      </FullWidth>
      <FullWidth>
        <Input
          name="building"
          label={labels.building}
          value={state.building}
          maxLength={160}
          hint={labels.buildingHint}
          error={buildingError}
          onChange={(event) => setState((current) => ({ ...current, building: event.target.value }))}
        />
      </FullWidth>
    </>
  );
}
