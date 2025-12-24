"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import ChristmasSaleModal from "@/components/ChristmasSaleModal";
import { useTRPC } from "@/server/client";
import ArticleSlider from "@/views/homepage/ArticleSlider";
import HeroSection from "@/views/homepage/HeroSection";
import PartnerScroller from "@/views/homepage/PartnerScroll";
import TopProductsSection from "@/views/homepage/TopProductsSection";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const HomePage = () => {
  const trpc = useTRPC();
  const { data: products } = useQuery(trpc.product.getAll.queryOptions({ isHomePage: true }));
  const { data: articles } = useQuery(trpc.article.getAll.queryOptions({ includeInactive: false }));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <ChristmasSaleModal />
      {/* 1. Header with clean, light design */}
      <header className="py-8 flex items-center justify-center relative flex-col">
        <Navbar />

        <HeroSection />
      </header>

      {/* 3. Product Article Slider */}
      {articles && articles.length > 0 && (
        <ArticleSlider articles={articles} products={products || []} />
      )}

      {/* 4. Top Selling Products Section */}
      <TopProductsSection products={products || []} />

      {/* 2. YouTuber/Partner Section */}
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
              <span className="gradient-text">Our Partners</span>
            </h3>
            <p className="text-gray-600">
              Top Minecraft content creators who trust our products
            </p>
          </motion.div>
          <PartnerScroller />
        </div>
      </section>

      {/* 5. Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;