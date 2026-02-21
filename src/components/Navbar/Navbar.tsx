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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldShowBanner = false;

  return (
    <>
      <SaleBanner isVisible={shouldShowBanner} onClose={() => undefined} />
      <div
        className={`fixed ${shouldShowBanner ? "top-[40px]" : "top-0"} left-0 right-0 z-[9999] isolate transition-all duration-300 ${
          isScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="relative mx-auto w-full max-w-7xl px-4">
          <div
            className={`relative rounded-xl overflow-hidden transition-all duration-300 border ${
              isScrolled
                ? "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                : "border-transparent bg-transparent backdrop-blur-0 shadow-none"
            }`}
          >
            {isScrolled && (
              <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-[0.12]" />
            )}
            <nav className="relative z-[10000] container mx-auto flex items-center justify-between px-6 py-4">
              <Logo />
              <NavMenu />
              <div className="flex items-center space-x-4">
                <NavIcons />
                <button
                  className="md:hidden p-2 text-[var(--primary)] transition-colors hover:text-[var(--accent-light)]"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <HiMenuAlt3 size={24} />
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-[color-mix(in_srgb,var(--background),#000_4%)] backdrop-blur-md md:hidden"
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] p-6">
              <Logo />
              <button
                className="p-2 text-[var(--primary)] transition-colors hover:text-[var(--accent-light)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <HiX size={24} />
              </button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <MobileNavMenu closeMenu={() => setMobileMenuOpen(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`${
          shouldShowBanner
            ? isScrolled
              ? "h-[120px]"
              : "h-[132px]"
            : isScrolled
              ? "h-24"
              : "h-28"
        } transition-all duration-300`}
      />
    </>
  );
};

const MobileNavMenu = ({ closeMenu }: { closeMenu: () => void }) => {
  const menuItems: { label: string; href: Route; external?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Videos", href: "/videos" },
    { label: "Vouches", href: "/vouches" },
    { label: "About Us", href: "/about" },
  ];

  const pathname = usePathname();

  return (
    <motion.ul
      className="flex w-full flex-col items-center space-y-6"
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
                transition: { duration: 0.45, ease: "easeOut" },
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
              className={`block rounded-lg px-6 py-3 text-xl font-medium uppercase tracking-[0.08em] transition-colors ${
                isActive
                  ? "bg-nav-active text-[var(--text-on-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--surface)] hover:text-[var(--accent-light)]"
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
