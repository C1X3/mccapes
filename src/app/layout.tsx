import type { Metadata } from "next";
import { CartProvider } from "@/context/CartContext";
import { TRPCReactProvider } from "@/server/client";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ClickTracker } from "@/components/ClickTracker";
import DiscordFloatingWidget from "@/components/DiscordFloatingWidget";
import LayoutNavbar from "@/components/LayoutNavbar";
import LayoutContentOffset from "@/components/LayoutContentOffset";

import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "MCCapes",
  description:
    "Get exclusive high-quality Minecraft capes, skins and accessories to make your character stand out.",
  keywords: [
    "minecraft",
    "capes",
    "skins",
    "minecraft cosmetics",
    "minecraft store",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Outfit:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
      >
        <GoogleAnalytics gaId="G-HJ43T34FHX" />
        <Toaster position="top-right" />

        <ClickTracker />
        <TRPCReactProvider>
          <CartProvider>
            <LayoutNavbar />
            <LayoutContentOffset>{children}</LayoutContentOffset>
          </CartProvider>
        </TRPCReactProvider>
        <DiscordFloatingWidget />
      </body>
    </html>
  );
}
