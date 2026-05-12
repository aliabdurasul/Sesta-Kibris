import React from "react";
import "@/index.css";
import Providers from "./providers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "SestaKibris",
  description: "Turkish Marketplace MVP",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className="bg-[#F7F7FB] text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
