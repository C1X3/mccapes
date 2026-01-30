import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Article } from "@generated/browser";
import ProductCard from "@/components/ProductCard";
import { ProductGetAllOutput } from "@/server/routes/_app";

interface ArticleSliderProps {
  articles: Article[];
  products: ProductGetAllOutput;
}

const ArticleSlider = ({ articles, products }: ArticleSliderProps) => {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dragDirection, setDragDirection] = useState(0);

  const currentArticle = articles[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? articles.length - 1 : prevIndex - 1,
    );
    setIsPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === articles.length - 1 ? 0 : prevIndex + 1,
    );
    setIsPlaying(false);
  };

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    // Only handle swipes on mobile devices
    if (window.innerWidth <= 768) {
      const threshold = 50;

      if (info.offset.x > threshold) {
        // Swiped right - go to previous
        setDragDirection(-1);
        goToPrevious();
      } else if (info.offset.x < -threshold) {
        // Swiped left - go to next
        setDragDirection(1);
        goToNext();
      }
    }
  };

  // Get video URL from S3
  const getVideoUrl = (videoKey: string) => {
    return `${process.env.NEXT_PUBLIC_MINIO_ENDPOINT}/videos/${videoKey}`;
  };

  const videoUrl = currentArticle ? getVideoUrl(currentArticle.videoKey) : "";
  const thumbnailUrl = currentArticle?.thumbnailUrl || "";

  // Handle video play
  const handleVideoPlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };

  if (!articles.length) return null;

  const paragraphs = currentArticle.description.split("\n\n");
  const firstParagraph = paragraphs[0];
  const floatClass =
    currentArticle.alignment === "right"
      ? "float-right md:ml-6"
      : "float-left md:mr-6";

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
    }),
  };

  return (
    <>
      <section className="py-16 bg-[var(--surface-light)] relative px-4 sm:px-6 lg:px-8">
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-[var(--primary-light)] to-transparent z-0"
          animate={{
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto relative">
          {/* Navigation buttons - desktop only */}
          <div className="hidden md:block absolute left-4 top-1/2 transform -translate-y-1/2 z-20">
            <button
              onClick={goToPrevious}
              className="w-12 h-12 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              disabled={articles.length <= 1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[var(--primary)]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div className="hidden md:block absolute right-4 top-1/2 transform -translate-y-1/2 z-20">
            <button
              onClick={goToNext}
              className="w-12 h-12 bg-white/90 hover:bg-white shadow-lg rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              disabled={articles.length <= 1}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-[var(--primary)]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          <AnimatePresence mode="wait" custom={dragDirection}>
            <motion.div
              key={currentIndex}
              custom={dragDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 500, damping: 50 },
                opacity: { duration: 0.15 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="relative md:cursor-default cursor-grab active:cursor-grabbing"
            >
              {/* Product Card if article has productSlug */}
              {currentArticle.productSlug && (
                <motion.div
                  className="mb-8 md:w-1/3 mx-auto"
                  variants={fadeInUp}
                >
                  <ProductCard
                    product={
                      products.find(
                        (x) => x.slug === currentArticle.productSlug,
                      )!
                    }
                    styles="article"
                  />
                </motion.div>
              )}

              {/* Title */}
              <motion.div
                className="mb-8 text-center md:text-left md:w-4/5 mx-auto"
                variants={fadeInUp}
              >
                <motion.h3
                  className="text-3xl font-bold mb-4 text-[var(--foreground)]"
                  variants={fadeInUp}
                >
                  <span className="gradient-text">{currentArticle.title}</span>
                </motion.h3>
              </motion.div>

              {/* Video and content layout */}
              <motion.div
                className="md:w-4/5 mx-auto mb-8 overflow-hidden"
                variants={fadeInUp}
              >
                {/* Video with custom thumbnail */}
                <div
                  className={`relative rounded-lg w-full md:w-1/2 ${floatClass} mb-4 overflow-hidden`}
                >
                  {!isPlaying && thumbnailUrl ? (
                    <div
                      className="relative aspect-video w-full cursor-pointer"
                      onClick={handleVideoPlay}
                    >
                      <Image
                        src={thumbnailUrl}
                        alt={currentArticle.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                          <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-[var(--primary)] border-b-[10px] border-b-transparent ml-1.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video">
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        controls={isPlaying}
                        className="w-full h-full rounded-lg"
                        onClick={!isPlaying ? handleVideoPlay : undefined}
                        poster={thumbnailUrl}
                      />
                    </div>
                  )}
                </div>

                {/* Text content */}
                <motion.p
                  className="text-gray-600 text-lg mb-4"
                  variants={fadeInUp}
                >
                  {firstParagraph}
                </motion.p>

                {/* Only show these next paragraphs if user is not on mobile*/}
                {window.innerWidth > 768 && (
                  <>
                    {paragraphs.length > 1 && (
                      <motion.p
                        className="text-gray-600 text-lg mb-4"
                        variants={fadeInUp}
                      >
                        {paragraphs[1]}
                      </motion.p>
                    )}

                    {paragraphs.length > 2 && (
                      <motion.p
                        className="text-gray-600 text-lg mb-4"
                        variants={fadeInUp}
                      >
                        {paragraphs[2]}
                      </motion.p>
                    )}
                  </>
                )}

                {/* Clearfix to handle float properly */}
                <div className="clear-both"></div>
              </motion.div>

              <div className="mt-6 gap-4 flex justify-center">
                <motion.button
                  className="minecraft-btn"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 20px rgba(74, 222, 128, 0.2)",
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                  variants={fadeInUp}
                  onClick={() => setShowModal(true)}
                >
                  Read More
                </motion.button>
                <motion.button
                  className="minecraft-btn"
                  whileHover={{
                    scale: 1.03,
                    boxShadow: "0 10px 20px rgba(74, 222, 128, 0.2)",
                    transition: { duration: 0.2 },
                  }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.1 } }}
                  variants={fadeInUp}
                  onClick={() =>
                    router.push(`/shop/${currentArticle.productSlug}`)
                  }
                >
                  Purchase Now
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Article indicators */}
          {articles.length > 1 && (
            <div className="flex justify-center mt-8 gap-2">
              {articles.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    setIsPlaying(false);
                  }}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentIndex
                      ? "bg-[var(--primary)] scale-125"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-lg w-[95vw] h-[95vh] overflow-hidden shadow-xl flex flex-col"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="flex justify-between items-center p-4">
              <h2 className="text-2xl font-bold text-[var(--foreground)]">
                <span className="gradient-text">{currentArticle.title}</span>
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-full">
              {/* Video on the side */}
              <div className="md:w-1/2 p-6 flex items-center justify-center">
                <div className="aspect-video w-full h-full max-h-[70vh] relative">
                  {!isPlaying && thumbnailUrl ? (
                    <div
                      className="relative aspect-video w-full h-full cursor-pointer"
                      onClick={handleVideoPlay}
                    >
                      <Image
                        src={thumbnailUrl}
                        alt={currentArticle.title}
                        layout="fill"
                        objectFit="cover"
                        className="rounded-lg"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                          <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[22px] border-l-[var(--primary)] border-b-[12px] border-b-transparent ml-2" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <video
                      width="100%"
                      height="100%"
                      src={videoUrl}
                      controls={isPlaying}
                      className="rounded-lg"
                      onClick={!isPlaying ? handleVideoPlay : undefined}
                      poster={thumbnailUrl}
                    />
                  )}
                </div>
              </div>

              {/* Article content on the side */}
              <div className="md:w-1/2 p-6 flex flex-col h-full">
                <div className="prose max-w-none flex-grow overflow-y-auto">
                  {currentArticle.description
                    .split("\n\n")
                    .map((paragraph, i) => (
                      <p key={i} className="mb-4 text-gray-600 text-xl">
                        {paragraph}
                      </p>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() =>
                      router.push(`/shop/${currentArticle.productSlug}`)
                    }
                    className="minecraft-btn mr-4"
                  >
                    Purchase Now
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="minecraft-btn"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default ArticleSlider;
