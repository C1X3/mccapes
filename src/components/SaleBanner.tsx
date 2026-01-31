"use client";

import { motion } from "framer-motion";
import { FaStar } from "react-icons/fa6";
import { HiX } from "react-icons/hi";

interface SaleBannerProps {
  isVisible: boolean;
  onClose: () => void;
}

const SaleBanner = ({ isVisible, onClose }: SaleBannerProps) => {
  if (!isVisible) return null;

  const messageContent = (
    <div className="flex items-center gap-3 whitespace-nowrap">
      <FaStar className="text-warning-light" size={16} />
      <span className="font-bold">NEW YEARS SALE!</span>
      <span className="text-warning-light font-semibold">UP TO 30% OFF</span>
      <span>Limited Time Only!</span>
      <FaStar className="text-warning-light" size={16} />
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
      <div
        className="absolute inset-0"
        style={{
          background:
            "repeating-linear-gradient(-45deg, var(--color-primary), var(--color-primary) 80px, var(--color-warning), var(--color-warning) 160px)",
        }}
      />
      <div className="relative py-2">
        <div className="absolute inset-0 overflow-hidden opacity-40 pointer-events-none">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-warning-light"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -20, 0],
                rotate: [0, 360],
                scale: [1, 1.5, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <FaStar size={10} />
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
