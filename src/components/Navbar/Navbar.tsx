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

interface NavbarProps {
  disableScrollState?: boolean;
  staticInContainer?: boolean;
  fullWidth?: boolean;
}

const Navbar = ({
  disableScrollState = false,
  staticInContainer = false,
  fullWidth = false,
}: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const effectiveScrolled = disableScrollState ? false : isScrolled;

  useEffect(() => {
    if (disableScrollState) {
      return;
    }
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [disableScrollState]);

  const shouldShowBanner = false;

  return (
    <>
      <SaleBanner isVisible={shouldShowBanner} onClose={() => undefined} />
      <div
        className={`w-full ${staticInContainer ? "relative" : "fixed"} ${staticInContainer ? "top-auto" : shouldShowBanner ? "top-[40px]" : "top-0"} left-0 right-0 z-[9999] isolate transition-all duration-300 ${
          effectiveScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className={fullWidth ? "relative w-full px-0" : "relative mx-auto w-full max-w-7xl px-4"}>
          <div
            className={`relative overflow-hidden transition-all duration-300 border ${fullWidth ? "rounded-none" : "rounded-xl"} ${
              effectiveScrolled
                ? "border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]"
                : "border-transparent bg-transparent backdrop-blur-0 shadow-none"
            }`}
          >
            {effectiveScrolled && (
              <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-[0.12]" />
            )}
            <nav className={`relative z-[10000] mx-auto flex items-center justify-between py-4 ${fullWidth ? "w-full px-4 md:px-6" : "container px-6"}`}>
              <Logo />
              <NavMenu />
              <div className="flex items-center space-x-4">
                <NavIcons />
                <button
                  className="md:hidden p-2 text-[var(--primary)] transition-colors hover:text-[var(--accent-light)]"
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                  aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {mobileMenuOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
                </button>
              </div>
            </nav>
          </div>

          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                className="absolute left-4 right-4 top-full z-[10010] mt-2 md:hidden"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-3 shadow-[0_20px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl">
                  <MobileNavMenu closeMenu={() => setMobileMenuOpen(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </>
  );
};

const MobileNavMenu = ({ closeMenu }: { closeMenu: () => void }) => {
  const menuItems: { label: string; href: Route; external?: boolean }[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Videos", href: "/videos" },
    { label: "About Us", href: "/about" },
  ];

  const pathname = usePathname();

  return (
    <motion.ul
      className="flex w-full flex-col gap-2"
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
            className="w-full"
          >
            <Link
              href={item.href}
              onClick={() => {
                if (!item.external) closeMenu();
              }}
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
              className={`block rounded-lg px-4 py-2.5 text-base font-semibold uppercase tracking-[0.08em] transition-colors ${
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
