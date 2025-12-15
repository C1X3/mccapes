"use client";

import { motion } from "framer-motion";
import { FaGift, FaSnowflake } from "react-icons/fa";
import { HiX } from "react-icons/hi";

interface SaleBannerProps {
  isVisible: boolean;
  onClose: () => void;
}

const SaleBanner = ({ isVisible, onClose }: SaleBannerProps) => {
  if (!isVisible) return null;

  const messageContent = (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <FaGift className="text-yellow-300" size={16} />
      <span className="font-bold">🎄 HOLIDAY SALE!</span>
      <span className="text-yellow-300 font-semibold">UP TO 30% OFF</span>
      <span>✨ Limited Time Only! ✨</span>
      <FaGift className="text-yellow-300" size={16} />
      <span className="mx-8">•</span>
    </div>
  );

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-[60] text-white overflow-hidden"
    >
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: "repeating-linear-gradient(-45deg, #dc2626, #dc2626 80px, #16a34a 80px, #16a34a 160px)",
        }}
      />
      <div className="relative py-2">
        <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <FaSnowflake size={10} />
            </motion.div>
          ))}
        </div>

        <div className="relative overflow-hidden">
          <motion.div
            className="flex items-center"
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center">
                {messageContent}
              </div>
            ))}
          </motion.div>
        </div>

        <button
          onClick={onClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="Close banner"
        >
          <HiX size={16} />
        </button>
      </div>
    </motion.div>
  );
};

export default SaleBanner;
