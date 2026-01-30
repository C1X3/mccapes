"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import NavIcons from "./NavIcons";
import NavMenu from "./NavMenu";
import { HiMenuAlt3, HiX } from "react-icons/hi";
import { usePathname } from "next/navigation";
import Link from "next/link";
import SaleBanner from "../SaleBanner";
import { Route } from "next";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [, setBannerVisible] = useState(true);

  useEffect(() => {
    const savedBannerState = sessionStorage.getItem("saleBannerVisible");
    if (savedBannerState !== null) {
      setBannerVisible(savedBannerState === "true");
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleCloseBanner = () => {
    setBannerVisible(false);
    sessionStorage.setItem("saleBannerVisible", "false");
  };

  const shouldShowBanner = false;

  return (
    <>
      <SaleBanner isVisible={shouldShowBanner} onClose={handleCloseBanner} />
      <div
        className={`fixed ${shouldShowBanner ? "top-[40px]" : "top-0"} left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "py-2 bg-[var(--background)]/90 backdrop-blur-lg"
            : "py-4"
        }`}
      >
        <div className="relative w-full max-w-7xl mx-auto px-4">
          <div
            className={`relative ${isScrolled ? "" : "glass-effect shadow-2xl"} rounded-xl overflow-hidden transition-all duration-300`}
          >
            <nav className="relative z-10 container mx-auto px-6 py-4 flex justify-between items-center">
              <Logo />
              <NavMenu />
              <div className="flex items-center space-x-4">
                <NavIcons />
                <button
                  className="md:hidden p-2 text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <HiMenuAlt3 size={24} />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-[var(--background)]/95 backdrop-blur-md flex flex-col md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
              <Logo />
              <button
                className="p-2 text-[var(--primary)] hover:text-[var(--primary-light)] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HiX size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <MobileNavMenu closeMenu={() => setMobileMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar + banner */}
      <div
        className={`${
          shouldShowBanner
            ? isScrolled
              ? "h-[104px]"
              : "h-[116px]"
            : isScrolled
              ? "h-16"
              : "h-24"
        } transition-all duration-300`}
      ></div>
    </>
  );
};

// Mobile Nav Menu Component
const MobileNavMenu = ({ closeMenu }: { closeMenu: () => void }) => {
  const menuItems: { label: string; href: Route; external?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Videos", href: "/videos" },
    { label: "Vouches", href: "/vouches" },
    { label: "Discord", href: "https://discord.mccapes.net", external: true },
  ];

  const pathname = usePathname();

  return (
    <motion.ul
      className="flex flex-col items-center space-y-6 w-full"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
        hidden: {},
      }}
    >
      {menuItems.map((item) => {
        const isActive = item.external
          ? false
          : pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));

        return (
          <motion.li
            key={item.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: "easeOut" },
              },
            }}
            className="w-full text-center"
          >
            <Link
              href={item.href}
              onClick={() => {
                if (!item.external) closeMenu();
              }}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={`text-xl font-medium transition-colors block py-3 px-6 rounded-lg ${
                isActive
                  ? "bg-green-500 text-white"
                  : "hover:bg-[var(--surface)] hover:text-[var(--primary)]"
              }`}
            >
              {item.label}
            </Link>
          </motion.li>
        );
      })}
    </motion.ul>
  );
};

export default Navbar;
