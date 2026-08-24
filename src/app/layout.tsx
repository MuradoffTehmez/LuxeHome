import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { Geist, Playfair_Display } from "next/font/google";
import { isStaging, siteConfig, siteUrl } from "@/config/site";
import { organizationSchema, websiteSchema } from "@/lib/seo";
import { THEME_RUNTIME_SHIM } from "@/lib/theme-runtime";
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

/** Google Analytics ölçmə ID-si — yalnız production-da yüklənir. */
const GA_MEASUREMENT_ID = "G-54KSFRM17B";

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
  alternates: { canonical: "/" },
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
    : {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, "max-image-preview": "large" },
      },
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
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${playfair.variable} ${geist.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_RUNTIME_SHIM }} />
        {!isStaging() && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-dvh antialiased">
        <script
          type="application/ld+json"
          // Struktur data statik obyektdən yaradılır — istifadəçi girişi daxil deyil.
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteSchema()),
          }}
        />
        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
