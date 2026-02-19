"use client";

import { Vouch } from "@/types/vouches";
import { FaStar } from "react-icons/fa";

interface VouchCardProps {
  vouch: Vouch;
}

const VouchCarouselCard = ({ vouch }: VouchCardProps) => {
  const handleClick = () => {
    window.open(vouch.discordLink, "_blank");
  };

  return (
    <div
      className="group h-full bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[var(--accent)] transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
      onClick={handleClick}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-base font-bold text-gray-800 group-hover:text-[var(--primary)] transition-colors truncate pr-2">
            {vouch.author}
          </h4>
          <div className="flex gap-0.5 shrink-0">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                size={13}
                className={i < vouch.rating ? "text-warning" : "text-gray-600"}
              />
            ))}
          </div>
        </div>

        <p className="text-gray-500 text-sm leading-relaxed line-clamp-4">
          {vouch.message}
        </p>
      </div>
    </div>
  );
};

export default VouchCarouselCard;
