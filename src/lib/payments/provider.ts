/**
 * Ödəniş provayderi adapteri (#246, PRD 16.7). Hazırda heç bir real provayder qoşulmayıb —
 * `getPaymentProvider()` həmişə `null` qaytarır və checkout «əlçatan deyil» cavabı verir.
 *
 * Yeni provayder (bank, kart prosessinqi) bu interfeysi tətbiq edir və burada qeydiyyata düşür;
 * aktivləşdirmə ayrıca təsdiq və test tələb edir (PRD 16.7 — «heç bir real ödəniş funksiyası ayrıca
 * təsdiq və test olmadan aktivləşdirilməməlidir»). Checkout bayraqları (`PAYMENT_CHECKOUT_ENABLED`)
 * açıq olsa belə provayder yoxdursa ödəniş yaranmır.
 */

export type CheckoutRequest = {
  /** `PaymentTransaction.id` — provayderə sifariş nömrəsi kimi ötürülür. */
  transactionId: string;
  /** Provayder tərəfində təkrar sorğunun eyni sifariş sayılması üçün. */
  idempotencyKey: string;
  amountMinor: number;
  currency: string;
  description: string;
  returnUrl: string;
};

export type CheckoutSession = { providerRef: string; redirectUrl: string };

export type PaymentProvider = {
  id: string;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  refund(input: { providerRef: string; amountMinor: number; idempotencyKey: string }): Promise<{ ok: boolean; failureReason?: string }>;
};

export function getPaymentProvider(): PaymentProvider | null {
  return null;
}
