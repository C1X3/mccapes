"use client";

import { motion } from "framer-motion";
import { FaSearch, FaShoppingCart, FaTimes } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

const NavIcons = () => {
  const router = useRouter();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Use Next.js router for client-side navigation
    router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchOpen(false);
    setSearchQuery("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
    };

    if (searchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchOpen]);

  return (
    <div className="flex items-center space-x-4">
      <div ref={searchRef} className="relative">
        {searchOpen ? (
          <motion.form
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "250px", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center"
            onSubmit={handleSearch}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-4 rounded-l-full bg-[var(--surface)] text-[var(--foreground)] focus:outline-none border-2 border-[var(--primary)]"
            />
            <button
              type="submit"
              className="flex items-center justify-center py-3 px-4 rounded-r-full border-2 border-l-0 border-[var(--primary)] bg-[var(--primary)] text-white hover:bg-[var(--primary-light)] transition-colors"
            >
              <FaSearch className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="absolute right-14 top-1/2 transform -translate-y-1/2 text-[var(--primary)] hover:text-[var(--primary-light)]"
            >
              <FaTimes />
            </button>
          </motion.form>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-full bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors flex items-center justify-center"
          >
            <FaSearch className="text-lg" />
          </motion.button>
        )}
      </div>
      <Link href="/cart">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors relative flex items-center justify-center"
        >
          <FaShoppingCart className="text-lg" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </motion.button>
      </Link>
    </div>
  );
};

export default NavIcons;
