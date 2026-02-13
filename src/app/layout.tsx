import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ExternalLinkHandler } from "@/components/ExternalLinkHandler";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

const GA_MEASUREMENT_ID = "G-YBKQP6Y2BV";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.chantipay.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ChantiPay - Logiciel devis factures artisan | Signature électronique & paiement",
    template: "%s | ChantiPay - Devis artisan",
  },
  description:
    "Logiciel de devis et factures pour artisans du bâtiment. Créez vos devis sur mobile, faites signer électroniquement et encaissez l'acompte instantanément. Idéal plombier, électricien, peintre, menuisier, maçon. Essai gratuit 7 jours.",
  keywords: [
    // Mots-clés principaux
    "logiciel devis artisan",
    "logiciel facturation artisan",
    "application devis bâtiment",
    "devis en ligne artisan",
    // Signature électronique
    "signature électronique devis",
    "signature numérique artisan",
    "signer devis sur tablette",
    // Par métier
    "devis plombier gratuit",
    "devis électricien",
    "devis peintre bâtiment",
    "devis menuisier",
    "devis maçon",
    "devis carreleur",
    // Fonctionnalités
    "acompte chantier en ligne",
    "paiement devis artisan",
    "facture électronique artisan",
    "Factur-X artisan",
    "PDF devis professionnel",
    // Mobile
    "application mobile artisan",
    "devis sur smartphone",
    "gestion chantier mobile",
    // Marque
    "ChantiPay",
  ],
  authors: [{ name: "ChantiPay", url: BASE_URL }],
  creator: "ChantiPay",
  publisher: "ChantiPay",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.svg", sizes: "192x192" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChantiPay",
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  category: "business",
  classification: "Business Software",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "ChantiPay",
    title: "ChantiPay - Logiciel devis & factures pour artisans du bâtiment",
    description:
      "Créez vos devis professionnels en 2 minutes, faites signer sur mobile et encaissez l'acompte instantanément. L'application n°1 des artisans du bâtiment.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChantiPay - Logiciel devis et factures pour artisans",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@chantipay",
    creator: "@chantipay",
    title: "ChantiPay - Devis & factures pour artisans",
    description:
      "Logiciel de devis pour artisans. Signature électronique, paiement en ligne, Factur-X. Essai gratuit 7 jours.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "fr-FR": BASE_URL,
    },
  },
  verification: {
    google: "Y0MnUNExWuqSx6dyjbQO51_7lt_hSJgBWO0gwwe-6nA",
  },
  other: {
    "google-site-verification": "", // À remplir avec le code Google Search Console
    "msvalidate.01": "", // À remplir si validation Bing
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// Données structurées JSON-LD pour le SEO
function JsonLdScript() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "ChantiPay",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    description:
      "Logiciel de devis et factures pour artisans du bâtiment. Signature électronique et paiement en ligne.",
    url: "https://www.chantipay.com",
    logo: "https://www.chantipay.com/og-image.png",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Essai gratuit 7 jours",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
    author: {
      "@type": "Organization",
      name: "ChantiPay",
      url: "https://www.chantipay.com",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "ChantiPay est-il gratuit ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ChantiPay propose un essai gratuit de 7 jours sans engagement. Ensuite, plusieurs formules sont disponibles à partir de 19€/mois.",
        },
      },
      {
        "@type": "Question",
        name: "La signature électronique est-elle légale ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, la signature électronique ChantiPay est conforme au règlement européen eIDAS et a la même valeur juridique qu'une signature manuscrite.",
        },
      },
      {
        "@type": "Question",
        name: "Puis-je utiliser ChantiPay sur mobile ?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Oui, ChantiPay fonctionne sur smartphone, tablette et ordinateur. Vous pouvez créer et faire signer vos devis directement sur chantier.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <JsonLdScript />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        {/* Google Analytics */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <ExternalLinkHandler />
          {children}
          <Toaster position="top-center" richColors />
          <ServiceWorkerRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}

// Prevent theme flicker on page load
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const storageKey = 'chantipay_theme';
            const stored = localStorage.getItem(storageKey);
            const theme = stored || 'system';
            
            function getSystemTheme() {
              return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            }
            
            const resolved = theme === 'system' ? getSystemTheme() : theme;
            
            if (resolved === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          })();
        `,
      }}
    />
  );
}

function ServiceWorkerRegistration() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(
                function(registration) {
                  console.log('ServiceWorker registration successful');
                },
                function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                }
              );
            });
          }
        `,
      }}
    />
  );
}
