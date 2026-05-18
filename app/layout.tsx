import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Saira_Condensed,
} from "next/font/google";
import { clientConfig } from "@/config/client";
import "./globals.css";

const brandDisplay = Saira_Condensed({
  variable: "--font-brand-display",
  weight: ["400"],
  subsets: ["latin"],
});

const brandBody = Cormorant_Garamond({
  variable: "--font-brand-body",
  weight: ["400", "500"],
  subsets: ["latin"],
});

const brandMono = IBM_Plex_Mono({
  variable: "--font-brand-mono",
  weight: ["400"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`https://${clientConfig.brand.domain}`),
  title: {
    default: clientConfig.brand.name,
    template: `%s · ${clientConfig.brand.name}`,
  },
  description: clientConfig.brand.tagline,
  openGraph: {
    title: clientConfig.brand.name,
    description: clientConfig.brand.tagline,
    url: `https://${clientConfig.brand.domain}`,
    siteName: clientConfig.brand.name,
    images: [clientConfig.brand.ogImage],
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
      className={`${brandDisplay.variable} ${brandBody.variable} ${brandMono.variable}`}
    >
      <body className="min-h-screen bg-bg text-body antialiased">{children}</body>
    </html>
  );
}
