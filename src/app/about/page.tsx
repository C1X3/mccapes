"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import AboutHeroSection from "@/views/about/AboutHeroSection";
import VideosCarousel from "@/views/about/VideosCarousel";
import VouchesCarousel from "@/views/about/VouchesCarousel";
import ArticleSlider from "@/views/homepage/ArticleSlider";
import PartnerScroller from "@/views/homepage/PartnerScroll";
import FAQSection from "@/components/FAQSection";
import { motion } from "framer-motion";

const orbs = [
  { size: 280, left: "2%",  top: "15%", speed: "10s" },
  { size: 320, left: "66%", top: "20%", speed: "15s" },
  { size: 170, left: "15%", top: "45%", speed: "11s" },
  { size: 120, left: "88%", top: "10%", speed: "9s"  },
  { size: 200, left: "50%", top: "70%", speed: "13s" },
  { size: 150, left: "80%", top: "60%", speed: "12s" },
];
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
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />

      {/* Hero + Videos + Vouches — single continuous gradient with shared orbs */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[var(--background)] to-[color-mix(in_srgb,var(--background),#000_5%)]">
        {/* Floating orbs across all three sections */}
        <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ zIndex: 0 }}>
          {orbs.map((orb, i) => (
            <div
              key={i}
              className="floating-orb absolute"
              style={{
                width: orb.size,
                height: orb.size,
                left: orb.left,
                top: orb.top,
                backgroundColor: "var(--primary)",
                opacity: 0.1,
                ["--dance-speed" as string]: orb.speed,
              }}
            />
          ))}
        </div>
        <AboutHeroSection />
        <VideosCarousel />
        <VouchesCarousel />
      </div>

      {/* Articles slider */}
      {articles && articles.length > 0 && (
        <ArticleSlider articles={articles} products={products || []} hideProduct />
      )}

      {/* Partners */}
      <section className="py-16 bg-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('/images/subtle-pattern.jpg')] bg-cover bg-center opacity-10 z-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
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
              <span className="gradient-text">Our Partners</span>
            </h3>
            <p className="text-gray-600">
              Top Minecraft content creators who trust our products
            </p>
          </motion.div>
          <PartnerScroller />
        </div>
      </section>

      {/* FAQ */}
      <main className="container mx-auto px-6 py-16 max-w-5xl">
        <FAQSection showTitle={true} showContactButtons={true} />
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;