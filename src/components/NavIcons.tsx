"use client";

import { motion } from "framer-motion";
import { FaSearch, FaShoppingCart } from "react-icons/fa";

interface NavIconsProps {
  cartCount?: number;
}

const NavIcons = ({ cartCount = 0 }: NavIconsProps) => {
  return (
    <div className="flex items-center space-x-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors"
      >
        <FaSearch />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="p-2 rounded-full bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors relative"
      >
        <FaShoppingCart />
        <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {cartCount}
        </span>
      </motion.button>
    </div>
  );
};

export default NavIcons;
