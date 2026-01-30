"use client";

import { Vouch } from "@/types/vouches";
import { motion } from "framer-motion";
import VouchCard from "@/components/VouchCard";
import { useEffect, useState } from "react";
import { getVouches } from "@/utils/vouches";

const VouchesGrid = () => {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVouches = async () => {
      try {
        const data = await getVouches();
        setVouches(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load vouches:", error);
        setIsLoading(false);
      }
    };

    loadVouches();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (vouches.length === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-semibold text-[var(--foreground)]">
          No vouches found
        </h3>
        <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
          Be the first to leave a review!
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
      }}
    >
      {vouches.map((vouch) => (
        <VouchCard key={vouch.id} vouch={vouch} />
      ))}
    </motion.div>
  );
};

export default VouchesGrid;
