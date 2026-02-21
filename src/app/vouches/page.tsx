"use client";

import Footer from "@/components/Footer";
import VouchesGrid from "@/views/vouches/VouchesGrid";
import { motion } from "framer-motion";

const VouchesPage = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />

      <section className="relative overflow-hidden">
        <div className="relative z-10 px-6 py-16">
          <div className="container mx-auto relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-2 text-5xl text-[var(--foreground)] md:text-6xl lg:text-7xl">
              Vouches
            </h1>
            <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
              See what our customers have to say about their experiences with
              our premium Minecraft cosmetics. Each vouch is linked to its
              original Discord message.
            </p>
          </motion.div>

          <VouchesGrid />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default VouchesPage;
