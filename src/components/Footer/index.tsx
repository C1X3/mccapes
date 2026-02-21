import { motion } from "framer-motion";
import { FaChevronRight } from "react-icons/fa";

const links = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Videos", href: "/videos" },
  { label: "Vouches", href: "/vouches" },
];

const Footer = () => {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_12%)] py-14 text-[var(--foreground)]">
      <motion.div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-[0.15]" />
      <motion.div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.04]" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h5 className="text-xl font-bold mb-4">
              <span className="text-[var(--primary)]">MC</span>
              <span className="logo-text">Capes</span>
            </h5>
            <p className="mb-4 text-[var(--color-text-secondary)]">
              Premium Minecraft cosmetics for dedicated players.
            </p>
          </div>

          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Shop
            </h5>
            <ul className="space-y-2">
              {links.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center text-[var(--color-text-secondary)] transition-opacity hover:opacity-85"
                  >
                    <FaChevronRight className="mr-2 text-xs" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Company
            </h5>
            <ul className="space-y-2">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
                { label: "About Us", href: "/about" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex items-center text-[var(--color-text-secondary)] transition-opacity hover:opacity-85"
                  >
                    <FaChevronRight className="mr-2 text-xs" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              Contact
            </h5>
            <address className="not-italic space-y-2">
              <a
                href="mailto:mccapesbusiness@gmail.com"
                className="flex items-center text-[var(--color-text-secondary)] transition-opacity hover:opacity-85"
              >
                <FaChevronRight className="mr-2 text-xs" />
                mccapesbusiness@gmail.com
              </a>
              <a
                href="https://discord.mccapes.net"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-[var(--color-text-secondary)] transition-opacity hover:opacity-85"
              >
                <FaChevronRight className="mr-2 text-xs" />
                Discord
              </a>
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between border-t border-[var(--border)] pt-8 md:flex-row">
          <p className="text-sm text-[var(--color-text-muted)]">
            &copy; 2026 MCCapes. All rights reserved.
          </p>
          <p className="mt-4 text-sm text-[var(--color-text-muted)] md:mt-0">
            mccapes.net
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
