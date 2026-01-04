import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ExternalLinkHandler } from "@/components/ExternalLinkHandler";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "./globals.css";

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
    default: "ChantiPay - Devis mobile, signature au doigt, acompte instantané pour artisans",
    template: "%s | ChantiPay",
  },
  description:
    "Application mobile-first pour artisans : créez des devis professionnels sur le terrain, faites signer au doigt, générez des PDF pro et encaissez l'acompte en quelques secondes. Plombiers, électriciens, peintres, menuisiers.",
  keywords: [
    "devis artisan",
    "application devis mobile",
    "signature électronique artisan",
    "acompte chantier",
    "devis plombier",
    "devis électricien",
    "PDF devis",
    "paiement artisan",
    "ChantiPay",
  ],
  authors: [{ name: "ChantiPay" }],
  creator: "ChantiPay",
  publisher: "ChantiPay",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChantiPay",
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: BASE_URL,
    siteName: "ChantiPay",
    title: "ChantiPay - Devis et acomptes pour artisans",
    description:
      "Devis signé, acompte encaissé, chantier sécurisé. L'application mobile-first pour les artisans.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ChantiPay - Devis et acomptes pour artisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChantiPay - Devis et acomptes pour artisans",
    description:
      "Devis signé, acompte encaissé, chantier sécurisé. L'application mobile-first pour les artisans.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
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
