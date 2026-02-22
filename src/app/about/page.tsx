"use client";

import Footer from "@/components/Footer";
import AboutHeroSection from "@/views/about/AboutHeroSection";
import VideosCarousel from "@/views/about/VideosCarousel";
import VouchesCarousel from "@/views/about/VouchesCarousel";
import ArticleSlider from "@/views/homepage/ArticleSlider";
import PartnerScroller from "@/views/homepage/PartnerScroll";
import FAQSection from "@/components/FAQSection";
import { motion } from "framer-motion";
import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";

const AboutPage = () => {
  const trpc = useTRPC();
  const { data: products } = useQuery(
    trpc.product.getAll.queryOptions({ isHomePage: true }),
  );
  const { data: articles } = useQuery(
    trpc.article.getAll.queryOptions({ includeInactive: false }),
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_40%,rgba(57,203,115,0.08))]" />
      {/* Top area + first sections share one continuous background */}
      <section className="relative overflow-hidden">
        {/* Hero + Videos + Vouches */}
        <div className="relative z-10 overflow-hidden">
          <AboutHeroSection />
          <VideosCarousel />
          <VouchesCarousel />
        </div>
      </section>

      {/* Articles slider */}
      {articles && articles.length > 0 && (
        <section className="relative z-10 w-full border-y border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_12%)]">
          <ArticleSlider articles={articles} products={products || []} hideProduct />
        </section>
      )}

      {/* Partners */}
      <section className="relative z-10 overflow-hidden px-4 py-18 md:px-8">
        <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
        <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.07),transparent_38%,rgba(57,203,115,0.08))]" />
        <div className="container relative z-10 mx-auto px-6">
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
              Featured Minecraft creators wearing and recommending our capes.
            </p>
          </motion.div>
          <PartnerScroller />
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-3xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-5 md:p-8">
          <FAQSection showTitle={true} showContactButtons={true} />
        </div>
      </section>

      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
};

export default AboutPage;
