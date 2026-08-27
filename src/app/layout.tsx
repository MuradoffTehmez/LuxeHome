import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Playfair_Display } from "next/font/google";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import { jsonLd, organizationSchema, websiteSchema } from "@/lib/seo";
import { THEME_RUNTIME_SHIM } from "@/lib/theme-runtime";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { getSetting, SETTING_KEYS } from "@/lib/settings";
import "./globals.css";

/**
 * Şrift seçimi:
 * Hər iki ailə `latin-ext` alt dəstini daxil edir — Azərbaycan əlifbasının
 * ə, ı, ö, ü, ş, ç, ğ simvolları tam dəstəklənir.
 */
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${siteConfig.name} — ${siteConfig.slogan}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "əmlak",
    "əmlak elanları",
    "daşınmaz əmlak",
    "Bakıda əmlak",
    "əmlak agentliyi",
    "əmlak satışı",
    "Bakı mənzil",
    "mənzil satışı",
    "mənzil kirayə",
    "villa satışı",
    "əmlak kirayə",
    "günlük kirayə",
    "aylıq kirayə",
    "həyət evi",
    "bağ evi",
    "torpaq sahəsi",
    "ofis icarəsi",
    "yeni tikili",
    "köhnə tikili",
    "Luxe Home Estate",
    "Luxe Home Estate MMC",
  ],
  authors: [{ name: siteConfig.legalName }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  formatDetection: { telephone: true, address: true, email: true },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
  other: {
    seobility: "915a7ee78cdfc3bf8b2b272351e8ac86",
  },
  openGraph: {
    type: "website",
    locale: "az_AZ",
    url: siteUrl(),
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.slogan}`,
    description: siteConfig.description,
  },
  robots: isStaging()
    ? { index: false, follow: false }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Zoom bloklanmır — əlçatanlıq tələbi.
  maximumScale: 5,
  themeColor: "#16191d",
};

import { ThemeProvider } from "@/components/theme-provider";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, messages, configuredTheme] = await Promise.all([
    getLocale(),
    getMessages(),
    getSetting(SETTING_KEYS.DEFAULT_THEME),
  ]);
  const defaultTheme = configuredTheme === "dark" || configuredTheme === "system" ? configuredTheme : "light";

  return (
    <html lang={locale} suppressHydrationWarning className={`${playfair.variable} ${geist.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_RUNTIME_SHIM }} />
      </head>
      <body className="min-h-dvh antialiased">
        <script {...jsonLd(organizationSchema())} />
        <script {...jsonLd(websiteSchema())} />
        <ThemeProvider defaultTheme={defaultTheme}>
          <NextIntlClientProvider messages={messages}>
            {children}
            <AnalyticsProvider />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
