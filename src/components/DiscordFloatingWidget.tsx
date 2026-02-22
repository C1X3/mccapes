"use client";

import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const CARD_WIDTH = 288;

const DiscordIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-7 h-7"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const DiscordFloatingWidget = () => {
  const [hovered, setHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;
  if (dismissed) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
  };

  return (
    <motion.div
      className="fixed right-0 top-[15%] z-50 flex items-start"
      style={{ width: 52 + CARD_WIDTH }}
      initial={{ x: CARD_WIDTH }}
      animate={{ x: hovered ? 0 : CARD_WIDTH }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tab — small button, top-left of the widget */}
      <div
        className="flex-shrink-0 flex items-center justify-center text-white rounded-l-2xl cursor-pointer"
        style={{
          background: "#5865F2",
          width: 52,
          height: 56,
          marginTop: 28,
        }}
        aria-label="Join our Discord server"
        onMouseEnter={() => setHovered(true)}
      >
        <DiscordIcon />
      </div>

      {/* Card — right side, top-left corner square to meet the tab */}
      <div
        className="relative flex-1 overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: "#2b2d31" }}
      >
        <button
          onClick={handleDismiss}
          aria-label="Dismiss Discord widget"
          className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full bg-[#4e5058] hover:bg-[#6d6f78] text-[#b5bac1] hover:text-white transition-colors z-10"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="w-2.5 h-2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        {/* Banner */}
        <div
          className="h-14 w-full"
          style={{ background: "#23a65e" }}
        />

        <div className="px-4 pb-4">
          {/* Favicon as server icon */}
          <div className="-mt-8 mb-3">
            <div className="w-16 h-16 rounded-2xl border-4 border-[#2b2d31] overflow-hidden bg-[#1e1f22] shadow-lg">
              <Image
                src="/favicon.ico"
                alt="MC Capes"
                width={64}
                height={64}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>

          <p className="text-white font-bold text-base mb-1">MC Capes</p>
          <div className="flex items-center gap-1.5 text-xs text-[#b5bac1] mb-1">
            <span className="w-2 h-2 rounded-full bg-[#23a55a] inline-block flex-shrink-0" />
            <span>5,000+ Members</span>
          </div>
          <p className="text-[11px] text-[#80848e] mb-2">Est. Dec 2024</p>
          <p className="text-[12px] text-[#b5bac1] leading-relaxed mb-4">
            MC Capes is the #1 online Minecraft cape shop. We verify that our
            cape codes are 100% legitimate before selling.
          </p>

          <a
            href="https://discord.mccapes.net"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 rounded-md font-semibold text-sm text-white transition-opacity hover:opacity-90 active:opacity-75"
            style={{ background: "#23a55a" }}
          >
            Join Server
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default DiscordFloatingWidget;
