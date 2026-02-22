"use client";

import { motion } from "framer-motion";
import { FaSearch, FaShoppingCart, FaTimes } from "react-icons/fa";
import { useCart } from "@/context/CartContext";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const NavIcons = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartPulse, setCartPulse] = useState(false);
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

  useEffect(() => {
    if (totalItems <= 0) return;
    setCartPulse(true);
    const timer = window.setTimeout(() => setCartPulse(false), 650);
    return () => window.clearTimeout(timer);
  }, [totalItems]);

  return (
    <div className="flex items-center space-x-4">
      <div ref={searchRef} className="relative">
        {searchOpen ? (
          <motion.form
            initial={{ width: 0, opacity: 0, x: 12 }}
            animate={{ width: "280px", opacity: 1, x: 0 }}
            exit={{ width: 0, opacity: 0, x: 12 }}
            transition={{ duration: 0.22 }}
            className="flex items-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_6%)] px-2"
            onSubmit={handleSearch}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
              }}
              className="w-full bg-transparent py-2.5 pl-3 pr-2 text-[var(--foreground)] focus:outline-none"
            />
            <button
              type="submit"
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--primary)] transition-colors hover:bg-[var(--primary)] hover:text-white"
            >
              <FaSearch className="text-lg" />
            </button>
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] transition-colors hover:bg-[color-mix(in_srgb,var(--surface),#000_18%)] hover:text-[var(--foreground)]"
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
          animate={
            totalItems > 0 && pathname !== "/cart"
              ? { boxShadow: ["0 0 0 rgba(57,203,115,0)", "0 0 18px rgba(57,203,115,0.35)", "0 0 0 rgba(57,203,115,0)"] }
              : { boxShadow: "0 0 0 rgba(57,203,115,0)" }
          }
          transition={
            totalItems > 0 && pathname !== "/cart"
              ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0.2 }
          }
          className="p-2 rounded-full bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-colors relative flex items-center justify-center"
        >
          <FaShoppingCart className="text-lg" />
          {totalItems > 0 && (
            <motion.span
              animate={cartPulse ? { scale: [1, 1.35, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="absolute -top-1 -right-1 bg-[var(--accent)] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
            >
              {totalItems}
            </motion.span>
          )}
        </motion.button>
      </Link>
    </div>
  );
};

export default NavIcons;
