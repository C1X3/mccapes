"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import VouchesGrid from "@/views/vouches/VouchesGrid";
import { motion } from "framer-motion";

const VouchesPage = () => {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header section */}
      <header className="py-8 flex items-center justify-center relative flex-col">
        <Navbar />
      </header>

      {/* Main content section */}
      <section className="py-16 bg-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('/images/subtle-pattern.jpg')] bg-cover bg-center opacity-10 z-0"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 60,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
              <span className="gradient-text">Customer Vouches</span>
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See what our customers have to say about their experiences with
              our premium Minecraft cosmetics. Each vouch is linked to its
              original Discord message.
            </p>
          </motion.div>

          <VouchesGrid />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VouchesPage;
