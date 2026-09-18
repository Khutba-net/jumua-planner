import type { Metadata } from "next";
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
  title: "Khutba",
  description: "Professional Khutbah Management Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://khutba.net"),
  openGraph: {
    title: "Khutba",
    description: "Professional Khutbah Management Platform for mosques and khatibs",
    url: "https://khutba.net",
    siteName: "Khutba",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Khutba",
    description: "Professional Khutbah Management Platform for mosques and khatibs",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${notoArabic.variable} h-full antialiased`}
    >
      <head>
        <meta name="theme-color" content="#00666d" />
        <script
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
