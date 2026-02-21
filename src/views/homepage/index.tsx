"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import { useTRPC } from "@/server/client";
import ArticleSlider from "@/views/homepage/ArticleSlider";
import HeroSection from "@/views/homepage/HeroSection";
import PartnerScroller from "@/views/homepage/PartnerScroll";
import TopProductsSection from "@/views/homepage/TopProductsSection";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const HomePage = () => {
  const trpc = useTRPC();
  const { data: products } = useQuery(
    trpc.product.getAll.queryOptions({ isHomePage: true }),
  );
  const { data: articles } = useQuery(
    trpc.article.getAll.queryOptions({ includeInactive: false }),
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <section className="relative overflow-visible">
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(21,101,52,0.09) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <header className="relative z-50 flex items-center justify-center py-0">
          <Navbar />
        </header>

        <div className="relative z-10">
          <HeroSection heroProducts={products || []} />
        </div>
      </section>

      <TopProductsSection products={products || []} />

      {articles && articles.length > 0 && (
        <section className="w-full border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_12%)] pb-18">
          <div className="px-2 md:px-6">
            <ArticleSlider articles={articles} products={products || []} />
          </div>
        </section>
      )}

      <section className="relative overflow-hidden px-4 py-18 md:px-8">
        <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
        <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.07),transparent_38%,rgba(57,203,115,0.08))]" />
        <div className="container relative z-10 mx-auto">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-5xl text-[var(--foreground)] md:text-6xl">
              Trusted Partners
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-[var(--color-text-secondary)]">
              Featured Minecraft creators wearing and recommending our releases.
            </p>
          </motion.div>
          <div className="px-2 py-5 md:px-3">
            <PartnerScroller />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
