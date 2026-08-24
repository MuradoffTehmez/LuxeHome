import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/[locale]/giris/actions", () => ({
  verifyTwoFactor: vi.fn(),
  completeEnrollment: vi.fn(),
  finishEnrollment: vi.fn(),
}));

import { VerifyForm } from "@/app/[locale]/giris/dogrulama/verify-form";
import { EnrollForm } from "@/app/[locale]/giris/2fa-qurulumu/enroll-form";

describe("əməkdaş doğrulama formaları", () => {
  it("qurulum kodunu altı rəqəmli mobil OTP kimi məhdudlaşdırır", () => {
    const html = renderToStaticMarkup(<EnrollForm />);

    expect(html).toContain('inputMode="numeric"');
    expect(html).toContain('autoComplete="one-time-code"');
    expect(html).toContain('pattern="[0-9]{6}"');
    expect(html).toContain('maxLength="6"');
  });

  it("giriş doğrulamasında həm TOTP, həm də ehtiyat koduna yer saxlayır", () => {
    const html = renderToStaticMarkup(<VerifyForm />);

    expect(html).toContain('inputMode="text"');
    expect(html).toContain('autoComplete="one-time-code"');
    expect(html).toContain('maxLength="9"');
    expect(html).not.toContain('pattern="[0-9]{6}"');
  });
});
