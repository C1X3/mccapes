"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import VouchCarouselCard from "./VouchCarouselCard";
import { getVouches } from "@/utils/vouches";
import { Vouch } from "@/types/vouches";
import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";

const VISIBLE = 5;
const GAP_PX = 16;

const VouchesCarousel = () => {
  const [vouches, setVouches] = useState<Vouch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Track previous values to distinguish resize vs user navigation
  const prevContainerWidth = useRef(0);
  const prevBase = useRef(0);

  useEffect(() => {
    getVouches()
      .then((data) => {
        const shuffled = [...data].sort(() => Math.random() - 0.5);
        setVouches(shuffled);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isLoading]); // re-run when loading finishes so the container div exists

  const tripled = useMemo(() => [...vouches, ...vouches, ...vouches], [vouches]);
  const base = vouches.length;

  // Exact pixels per card: (containerWidth + gap) / VISIBLE
  const cardStep = containerWidth > 0 ? (containerWidth + GAP_PX) / VISIBLE : 0;

  useEffect(() => {
    if (cardStep === 0 || base === 0) return;

    const shiftIndex = offset + base;
    const targetX = -shiftIndex * cardStep;

    // Instant snap on first render, resize, or data load — animate on user navigation
    const isInstant =
      prevContainerWidth.current === 0 ||
      prevContainerWidth.current !== containerWidth ||
      prevBase.current !== base;

    prevContainerWidth.current = containerWidth;
    prevBase.current = base;

    if (isInstant) {
      x.set(targetX);
      return;
    }

    const controls = animate(x, targetX, {
      type: "spring",
      stiffness: 300,
      damping: 35,
      onComplete: () => {
        // Seamlessly loop back to equivalent middle position
        if (offset >= base || offset <= -base) {
          const wrapped = ((offset % base) + base) % base;
          x.set(-(wrapped + base) * cardStep);
          setOffset(wrapped);
        }
      },
    });

    return () => controls.stop();
  }, [offset, containerWidth, base, cardStep, x]);

  const goToPrevious = () => setOffset((o) => o - VISIBLE);
  const goToNext = () => setOffset((o) => o + VISIBLE);
  const goToPreviousMobile = () => setOffset((o) => o - 2);
  const goToNextMobile = () => setOffset((o) => o + 2);

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-[var(--background)] to-[color-mix(in_srgb,var(--background),#000_15%)] relative px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto flex justify-center items-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]" />
        </div>
      </section>
    );
  }

  if (vouches.length === 0) return null;

  return (
    <section className="pt-6 pb-16 relative px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="container mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
            Customer Vouches
          </h3>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See what our customers have to say about their experiences with our
            premium Minecraft cosmetics.
          </p>
        </motion.div>

        {/* Desktop: arrows on sides, strip in between */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={goToPrevious}
            className="shrink-0 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <div className="overflow-hidden flex-1 min-w-0" ref={containerRef}>
            <motion.div
              className="flex items-stretch"
              style={{ x, gap: `${GAP_PX}px` }}
            >
              {tripled.map((vouch, i) => (
                <div
                  key={i}
                  className="shrink-0"
                  style={{ width: `calc(${100 / VISIBLE}% - ${(GAP_PX * (VISIBLE - 1)) / VISIBLE}px)` }}
                >
                  <VouchCarouselCard vouch={vouch} />
                </div>
              ))}
            </motion.div>
          </div>

          <button
            onClick={goToNext}
            className="shrink-0 w-10 h-10 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--primary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Mobile: swipeable 2 cards */}
        <div className="md:hidden overflow-hidden">
          <motion.div
            key={offset}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.x < -50) goToNextMobile();
              else if (info.offset.x > 50) goToPreviousMobile();
            }}
            className="cursor-grab active:cursor-grabbing grid grid-cols-2 gap-3"
          >
            {[0, 1].map((j) => (
              <VouchCarouselCard key={j} vouch={vouches[((offset + j) % base + base) % base]} />
            ))}
          </motion.div>
          <div className="flex justify-center gap-1.5 mt-4">
            {Array.from({ length: Math.ceil(base / 2) }).map((_, i) => {
              const active = Math.floor(((offset % base) + base) % base / 2) === i;
              return <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${active ? "w-4 bg-[var(--primary)]" : "w-1.5 bg-gray-300"}`} />;
            })}
          </div>
        </div>

        {/* View all link */}
        <div className="flex justify-center mt-8">
          <Link
            href="/vouches"
            className="text-sm font-semibold px-5 py-2 rounded-full bg-gray-100 border border-gray-200 text-gray-500 hover:bg-[var(--primary)] hover:text-white hover:border-[var(--primary)] shadow-sm transition-all duration-200"
          >
            View All
          </Link>
        </div>
      </div>
    </section>
  );
};

export default VouchesCarousel;
