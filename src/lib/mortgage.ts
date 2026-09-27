/**
 * İpoteka və büdcə hesablamaları (Public PRD §141-142).
 *
 * Modul saf funksiyalardan ibarətdir: eyni hesablama həm ayrıca kalkulyator
 * səhifəsində, həm əmlak detalındakı kompakt blokda, həm də testdə işlədilir.
 *
 * **Bu, maliyyə məsləhəti deyil.** Annuitet düsturu banklararası standartdır,
 * lakin faktiki ödəniş cədvəli komissiya, sığorta və bankın öz qaydalarından
 * asılıdır. UI-da hər nəticənin yanında xəbərdarlıq göstərilir.
 */

export type MortgageInput = {
  /** Əmlakın tam qiyməti. */
  price: number;
  /** İlkin ödəniş — qiymətdən çıxılır. */
  downPayment: number;
  /** İllik nominal faiz dərəcəsi, faizlə (məs. 8 → 8%). */
  annualRatePercent: number;
  /** Kreditin müddəti, il. */
  years: number;
};

export type MortgageResult = {
  loanAmount: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
};

/**
 * Annuitet (bərabər aylıq ödənişli) kredit hesablaması.
 *
 * `null` qaytarır — məlumat natamam və ya mənasızdırsa (mənfi dəyər, ilkin
 * ödəniş qiymətdən böyük, sıfır müddət). Çağıran tərəf istifadəçiyə səhv
 * mesajı göstərir; uydurma rəqəm qaytarmaq daha pis olardı.
 */
export function calculateMortgage(input: MortgageInput): MortgageResult | null {
  const { price, downPayment, annualRatePercent, years } = input;

  if (![price, downPayment, annualRatePercent, years].every(Number.isFinite)) return null;
  if (price <= 0 || years <= 0 || downPayment < 0 || annualRatePercent < 0) return null;
  if (downPayment >= price) return null;

  const loanAmount = price - downPayment;
  const months = Math.round(years * 12);
  const monthlyRate = annualRatePercent / 100 / 12;

  // Faizsiz kredit annuitet düsturunda sıfıra bölünməyə gətirir — ayrıca hal.
  const monthlyPayment =
    monthlyRate === 0
      ? loanAmount / months
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

  if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) return null;

  const totalPayment = monthlyPayment * months;

  return {
    loanAmount: round2(loanAmount),
    monthlyPayment: round2(monthlyPayment),
    totalPayment: round2(totalPayment),
    totalInterest: round2(totalPayment - loanAmount),
  };
}

/**
 * Aylıq gəlirin kredit ödənişinə ayrıla bilən hissəsi.
 *
 * 35% mühafizəkar və geniş qəbul edilmiş həddir. Dəyər sabit saxlanılır ki,
 * nəticə hər səhifədə eyni olsun; bankın öz limiti fərqli ola bilər və bu,
 * UI-dakı xəbərdarlıqda qeyd olunur.
 */
export const AFFORDABILITY_INCOME_RATIO = 0.35;

export type AffordabilityInput = {
  monthlyIncome: number;
  downPayment: number;
  annualRatePercent: number;
  years: number;
};

export type AffordabilityResult = {
  maxMonthlyPayment: number;
  /** Ehtiyatlı qiymətləndirmə — gəlirin 25%-i ilə. */
  minPrice: number;
  /** Yuxarı hədd — gəlirin 35%-i ilə. */
  maxPrice: number;
};

export function calculateAffordability(input: AffordabilityInput): AffordabilityResult | null {
  const { monthlyIncome, downPayment, annualRatePercent, years } = input;

  if (![monthlyIncome, downPayment, annualRatePercent, years].every(Number.isFinite)) return null;
  if (monthlyIncome <= 0 || years <= 0 || downPayment < 0 || annualRatePercent < 0) return null;

  const months = Math.round(years * 12);
  const monthlyRate = annualRatePercent / 100 / 12;

  const principalFor = (payment: number) =>
    monthlyRate === 0
      ? payment * months
      : (payment * (1 - Math.pow(1 + monthlyRate, -months))) / monthlyRate;

  const conservativePayment = monthlyIncome * 0.25;
  const maxPayment = monthlyIncome * AFFORDABILITY_INCOME_RATIO;

  const minPrice = principalFor(conservativePayment) + downPayment;
  const maxPrice = principalFor(maxPayment) + downPayment;

  if (!Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;

  return {
    maxMonthlyPayment: round2(maxPayment),
    minPrice: round2(minPrice),
    maxPrice: round2(maxPrice),
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export type InstallmentInput = {
  price: number;
  /** İlkin ödəniş, qiymətin faizi (0–90). */
  downPaymentPercent: number;
  /** Ödəniş müddəti, ay. */
  months: number;
  /**
   * Tikinti şirkətinin hissə-hissə ödənişə əlavə etdiyi qiymət, **qalan borcun faizi**
   * (bütün müddət üçün, illik deyil). Bakıda daxili kredit çox vaxt 0%-dir.
   */
  markupPercent: number;
};

export type InstallmentResult = {
  downPayment: number;
  financed: number;
  markup: number;
  monthlyPayment: number;
  totalPayment: number;
};

/**
 * Daxili (tikintiçi) hissə-hissə ödəniş — bərabər aylıq hissələr (#107).
 *
 * Bankın annuitet kreditindən fərqli olaraq faiz aylıq kapitallaşmır: əlavə qiymət
 * qalan borca bir dəfə tətbiq olunur və müddətə bərabər bölünür. Mənasız daxiletmədə
 * `null` qaytarılır.
 */
export function calculateInstallment(input: InstallmentInput): InstallmentResult | null {
  const { price, downPaymentPercent, months, markupPercent } = input;
  if (![price, downPaymentPercent, months, markupPercent].every(Number.isFinite)) return null;
  if (price <= 0 || months < 1 || months > 120 || markupPercent < 0 || markupPercent > 100) return null;
  if (downPaymentPercent < 0 || downPaymentPercent >= 100) return null;

  const downPayment = price * (downPaymentPercent / 100);
  const financed = price - downPayment;
  const markup = financed * (markupPercent / 100);
  const monthlyPayment = (financed + markup) / Math.round(months);

  return {
    downPayment: round2(downPayment),
    financed: round2(financed),
    markup: round2(markup),
    monthlyPayment: round2(monthlyPayment),
    totalPayment: round2(downPayment + financed + markup),
  };
}
