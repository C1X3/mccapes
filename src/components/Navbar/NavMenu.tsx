"use client";

import { motion } from "framer-motion";

// Animations
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const items = [
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
];

const NavMenu = () => {
  return (
    <motion.ul
      className="hidden md:flex space-x-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.li key={item.label} variants={fadeInUp} className="relative group">
          <a
            href={item.href}
            className="font-medium transition-colors hover:text-[var(--primary-light)]"
          >
            {item.label}
          </a>
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary)] transition-all group-hover:w-full" />
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default NavMenu;
