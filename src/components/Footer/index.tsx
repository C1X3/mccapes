import { motion } from "framer-motion";
import { FaChevronRight, FaPlayCircle } from "react-icons/fa";
import { HiCube } from "react-icons/hi";

const links = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Shop",
    href: "/shop",
  },
  {
    label: "Vouches",
    href: "/vouches",
  },
  {
    label: "Discord",
    href: "https://discord.mccapes.net"
  }
];

const Footer = () => {
  return (
    <footer className="bg-[var(--surface-dark)] text-[var(--foreground)] py-12 relative overflow-hidden">
      <motion.div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)] to-transparent opacity-10 z-0" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h5 className="text-xl font-bold mb-4 gradient-text">MCCapes</h5>
            <p className="text-gray-400 mb-4">
              Premium Minecraft cosmetics for discerning players.
            </p>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4 text-[var(--primary-light)]">
              Shop
            </h5>
            <ul className="space-y-2">
              {links.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-[var(--primary-light)] transition-colors flex items-center"
                  >
                    <FaChevronRight className="mr-2 text-xs" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4 text-[var(--accent-light)]">
              Company
            </h5>            <ul className="space-y-2">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-gray-400 hover:text-[var(--accent-light)] transition-colors flex items-center"
                  >
                    <FaChevronRight className="mr-2 text-xs" />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="text-lg font-semibold mb-4 text-[var(--tertiary-light)]">
              Contact Us
            </h5>
            <address className="text-gray-400 not-italic space-y-2">
              <p className="flex items-center">
                <HiCube className="mr-2" />
                mccapesbusiness@gmail.com
              </p>
              <p className="flex items-center">
                <FaPlayCircle className="mr-2" />
                <a href="https://discord.mccapes.net">Discord</a>
              </p>
            </address>
          </div>
        </div>

        <div className="border-t border-[var(--surface-light)] mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; 2025 MCCapes. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm mt-4 md:mt-0">mccapes.net</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;