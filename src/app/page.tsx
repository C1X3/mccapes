"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  FaChevronRight,
  FaGem,
  FaPlayCircle,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";
import { HiCube, HiLightningBolt, HiSpeakerphone } from "react-icons/hi";

// Featured product data
const featuredProducts = [
  {
    id: 1,
    name: "Enchanted Diamond Cape",
    description: "Rare glowing cape with diamond particles effect",
    price: 24.99,
    image: "/images/diamond-cape.svg",
    category: "capes",
    badge: "Popular",
  },
  {
    id: 2,
    name: "Emerald Armor Skin",
    description: "Turn your armor into gleaming emerald",
    price: 19.99,
    image: "/images/emerald-armor.svg",
    category: "skins",
    badge: "New",
  },
  {
    id: 3,
    name: "Fiery Dragon Wings",
    description: "Majestic wings with animated flame effects",
    price: 29.99,
    image: "/images/dragon-wings.svg",
    category: "accessories",
    badge: "Best Seller",
  },
  {
    id: 4,
    name: "Ender Guardian Helmet",
    description: "Limited edition helmet with particle effects",
    price: 15.99,
    image: "/images/ender-helmet.svg",
    category: "accessories",
    badge: "Limited",
  },
];

// Categories with updated icons
const categories = [
  {
    name: "Capes",
    icon: <HiSpeakerphone size={24} />,
    color: "var(--primary)",
  },
  {
    name: "Skins",
    icon: <FaShieldAlt size={24} />,
    color: "var(--accent)",
  },
  {
    name: "Accessories",
    icon: <FaGem size={24} />,
    color: "var(--secondary)",
  },
  {
    name: "Bundles",
    icon: <HiLightningBolt size={24} />,
    color: "var(--tertiary)",
  },
];

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

const HomePage = () => {
  // Instead of using an external service, we'll use our local SVG images
  const getLocalImage = (name: string) => {
    // Map the name to our local SVG images
    const imageMap: Record<string, string> = {
      "Minecraft Hero": "/images/minecraft-hero.svg",
      Diamond: "/images/diamond.svg",
      "Water Ripple": "/images/subtle-pattern.jpg",
      Clouds: "/images/subtle-clouds.jpg",
      // Add more mappings as needed
    };

    return imageMap[name] || "/images/minecraft-hero.svg"; // Default fallback
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hero header with glassmorphism effect - floating box */}
      <div className="py-8 px-4 flex items-center justify-center relative flex-col">
        <Navbar />

        <div className="relative z-10 container mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center">
          <motion.div
            className="md:w-1/2 mb-10 md:mb-0"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-[var(--foreground)]">
              Elevate Your <span className="gradient-text"> Minecraft </span>
              Experience
            </h2>
            <p className="text-lg md:text-xl mb-8 text-gray-400 max-w-md">
              Premium capes, skins, and accessories to make your character stand
              out in the digital realm.
            </p>
            <div className="flex space-x-4">
              <motion.button
                className="minecraft-btn neon-glow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Shop Now
              </motion.button>
              <motion.button
                className="px-6 py-3 rounded-lg border-2 border-[var(--primary)] text-[var(--primary)] font-medium transition-all glass-effect"
                whileHover={{
                  borderColor: "var(--primary-light)",
                  color: "var(--primary-light)",
                }}
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>

          <motion.div
            className="md:w-1/2 relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full h-[350px] md:h-[400px] lg:h-[500px] neon-border">
              <motion.div
                className="absolute w-full h-full floating"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Image
                  src={getLocalImage("Minecraft Hero")}
                  alt="Minecraft Character with Premium Cape"
                  fill
                  style={{ objectFit: "contain" }}
                  priority
                />
              </motion.div>

              <motion.div
                className="absolute -bottom-8 -right-8 w-40 h-40 pulse neon-glow"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Image
                  src={getLocalImage("Diamond")}
                  alt="Diamond Decoration"
                  fill
                  style={{ objectFit: "contain" }}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Categories Section */}
      <section className="py-16 bg-[var(--surface)] relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-[url('/images/subtle-pattern.jpg')] bg-cover bg-center opacity-5 z-0" />

        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
              <span className="gradient-text">Browse Categories</span>
            </h3>
            <p className="text-gray-400">
              Find the perfect style for your Minecraft adventures
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                variants={fadeInUp}
                className="relative glass-effect overflow-hidden group"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div
                  className="h-40 flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${category.color}33, transparent)`,
                  }}
                >
                  <motion.div
                    className="text-[var(--foreground)]"
                    style={{ color: category.color }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {category.icon}
                  </motion.div>
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
                    {category.name}
                  </h4>
                  <p className="text-gray-400 mb-4">
                    Exclusive {category.name.toLowerCase()} collection
                  </p>
                  <motion.div
                    className="w-full h-0.5 bg-gray-700 relative overflow-hidden"
                    whileHover={{ scale: 1.01 }}
                  >
                    <motion.div
                      className="absolute top-0 left-0 h-full w-0"
                      style={{ backgroundColor: category.color }}
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </motion.div>
                  <motion.a
                    href="#"
                    className="inline-block mt-4 font-medium"
                    style={{ color: category.color }}
                    whileHover={{ x: 5 }}
                  >
                    Browse All{" "}
                    <FaChevronRight className="inline ml-1" size={12} />
                  </motion.a>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 bg-[var(--background)] relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-dark)] to-transparent opacity-5 z-0" />

        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
              <span className="gradient-text">Featured Products</span>
            </h3>
            <p className="text-gray-400">Our most popular Minecraft items</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {featuredProducts.map((product) => (
              <motion.div
                key={product.id}
                variants={fadeInUp}
                className="glass-effect"
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                <div className="relative h-64">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    style={{ objectFit: "contain" }}
                  />
                  <div className="absolute top-0 right-0 bg-[var(--accent)] text-white px-3 py-1 rounded-bl-lg">
                    {product.badge}
                  </div>
                </div>
                <div className="p-6">
                  <h4 className="text-lg font-semibold mb-2 text-[var(--foreground)]">
                    {product.name}
                  </h4>
                  <p className="text-gray-400 text-sm mb-4">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-[var(--primary-light)]">
                      ${product.price}
                    </span>
                    <motion.button
                      className="p-2 rounded-full bg-[var(--primary)] text-white neon-glow"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaShoppingCart />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              className="minecraft-btn px-8 py-3 bg-[var(--primary)] neon-glow flex items-center mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              View All Products
              <FaChevronRight className="ml-2" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-[var(--surface)] relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-[url('/images/subtle-pattern.jpg')] bg-cover bg-center opacity-5 z-0" />

        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
              <span className="gradient-text">What Our Customers Say</span>
            </h3>
            <p className="text-gray-400">
              Join thousands of happy Minecraft players
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                name: "Steve_Miner42",
                avatar: "S",
                color: "var(--primary)",
                text: "The diamond cape looks amazing in-game! All my friends are asking where I got it from.",
              },
              {
                name: "EnderQueen",
                avatar: "E",
                color: "var(--accent)",
                text: "The customer service is top-notch. Had an issue with my purchase and they fixed it right away.",
              },
              {
                name: "RedstoneWizard",
                avatar: "R",
                color: "var(--secondary)",
                text: "I've bought from many Minecraft shops, but MCCapes has the best quality and most unique designs.",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="glass-effect p-6"
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="flex items-center mb-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: testimonial.color }}
                  >
                    {testimonial.avatar}
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold text-[var(--foreground)]">
                      {testimonial.name}
                    </h4>
                    <div className="flex text-[var(--accent)]">
                      <FaStar />
                      <FaStar />
                      <FaStar />
                      <FaStar />
                      <FaStar />
                    </div>
                  </div>
                </div>
                <p className="text-gray-400 italic">
                  &quot;{testimonial.text}&quot;
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface-dark)] text-[var(--foreground)] py-12 relative overflow-hidden">
        <motion.div className="absolute inset-0 bg-gradient-to-b from-[var(--surface)] to-transparent opacity-10 z-0" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-xl font-bold mb-4 gradient-text">MCCapes</h5>
              <p className="text-gray-400 mb-4">
                Premium Minecraft cosmetics for discerning players.
              </p>
              <div className="flex space-x-4">
                {/* Social media icons */}
                {["Facebook", "Twitter", "Instagram", "Discord"].map(
                  (social) => (
                    <a
                      key={social}
                      href="#"
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface)] hover:bg-[var(--primary)] transition-colors"
                    >
                      {social.charAt(0)}
                    </a>
                  )
                )}
              </div>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4 text-[var(--primary-light)]">
                Shop
              </h5>
              <ul className="space-y-2">
                {[
                  "All Products",
                  "Capes",
                  "Skins",
                  "Accessories",
                  "Bundles",
                  "Gift Cards",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-[var(--primary-light)] transition-colors flex items-center"
                    >
                      <FaChevronRight className="mr-2 text-xs" />
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold mb-4 text-[var(--accent-light)]">
                Company
              </h5>
              <ul className="space-y-2">
                {[
                  "About Us",
                  "Contact",
                  "FAQ",
                  "Privacy Policy",
                  "Terms of Service",
                ].map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-[var(--accent-light)] transition-colors flex items-center"
                    >
                      <FaChevronRight className="mr-2 text-xs" />
                      {item}
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
                  support@mccapes.com
                </p>
                <p className="flex items-center">
                  <FaPlayCircle className="mr-2" />
                  Discord: MCCapes
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
    </div>
  );
};

export default HomePage;
