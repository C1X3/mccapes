import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import { TRPCReactProvider } from "@/server/client";

import "./globals.css";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MCCapes - Premium Minecraft Cosmetics",
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster position="top-right" />

        <TRPCReactProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </TRPCReactProvider>
      </body >
    </html >
  );
}
