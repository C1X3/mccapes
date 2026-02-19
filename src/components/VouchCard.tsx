"use client";

import { Vouch } from "@/types/vouches";
import { FaStar } from "react-icons/fa";

interface VouchCardProps {
  vouch: Vouch;
}

const VouchCard = ({ vouch }: VouchCardProps) => {
  // Function to handle click and redirect to Discord
  const handleClick = () => {
    window.open(vouch.discordLink, "_blank");
  };

  return (
    <div
      className="group h-full bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_15%)] to-[var(--background)] rounded-2xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] hover:border-[var(--accent)] backdrop-blur-sm transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <div className="p-6">
        <div className="flex items-center mb-2">
          <div>
            <h4 className="text-lg font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
              {vouch.author}
            </h4>
          </div>
        </div>

        <div className="flex text-warning mb-2">
          {[...Array(5)].map((_, i) => (
            <FaStar
              key={i}
              size={16}
              className={i < vouch.rating ? "text-warning" : "text-gray-600"}
            />
          ))}
        </div>

        <p className="text-[color-mix(in_srgb,var(--foreground),#888_30%)] text-sm">
          {vouch.message}
        </p>
      </div>
    </div>
  );
};

export default VouchCard;
