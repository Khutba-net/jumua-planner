import type { Metadata } from "next";
import { headers } from "next/headers";
import { Plus_Jakarta_Sans, Noto_Naskh_Arabic } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const notoArabic = Noto_Naskh_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Khutba — Plan a Year of Khutbahs That Hold Together",
    template: "%s | Khutba",
  },
  description: "Khutba is a planning and scheduling platform for Friday khatibs, mosques, and Islamic institutions. Build a coherent annual khutbah plan, assign khatibs, and manage multiple mosques from one place.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://khutba.net"),
  keywords: ["khutbah", "khutba", "Friday sermon", "mosque management", "khatib", "Islamic", "sermon planner", "jumua"],
  authors: [{ name: "Khutba" }],
  creator: "Khutba",
  openGraph: {
    title: "Khutba — Plan a Year of Khutbahs That Hold Together",
    description: "A planning and scheduling platform for Friday khatibs, mosques, and Islamic institutions.",
    url: "https://khutba.net",
    siteName: "Khutba",
    type: "website",
    locale: "en_US",
    images: [{ url: "/logo.svg", width: 100, height: 100, alt: "Khutba logo" }],
  },
  twitter: {
    card: "summary",
    title: "Khutba — Plan a Year of Khutbahs That Hold Together",
    description: "A planning and scheduling platform for Friday khatibs, mosques, and Islamic institutions.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  alternates: {
    canonical: "https://khutba.net",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") || "";
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#00666d" />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Khutba",
              url: "https://khutba.net",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: "A planning and scheduling platform for Friday khatibs, mosques, and Islamic institutions.",
              offers: {
                "@type": "AggregateOffer",
                priceCurrency: "USD",
                lowPrice: "10",
                highPrice: "50",
                offerCount: "3",
              },
            }),
          }}
        />
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('jp_theme');if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}if('serviceWorker'in navigator){navigator.serviceWorker.register('/sw.js').catch(function(){})}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
