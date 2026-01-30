import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    handler(); // run on mount
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
};

const HeroSection = () => {
  const router = useRouter();
  const isMobile = useIsMobile(768); // anything < 768px is “mobile”

  return (
    <div className="relative w-full py-24">
      {/* BACKGROUND ORBS CONTAINER */}
      {!isMobile && (
        <div
          className="absolute inset-0 overflow-visible pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const size = 100 + Math.random() * 200;
            const left = Math.random() * 120 - 10 + "%";
            const top = Math.random() * 120 - 10 + "%";
            return (
              <div
                key={i}
                className="floating-orb absolute"
                style={{
                  width: size,
                  height: size,
                  left,
                  top,
                  backgroundColor: "var(--primary)",
                  opacity: 0.1,
                  // your CSS-animation lives in .floating-orb
                }}
              />
            );
          })}
        </div>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="relative w-full">
        {/* CONTENT CONTAINER */}
        <div className="container mx-auto px-6 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* LEFT: TEXT & BUTTONS */}
            <motion.div
              className="w-full md:w-1/2 flex flex-col"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { staggerChildren: 0.2 },
                },
              }}
            >
              <motion.h2
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-3 animate-gradient-x"
                variants={{ hidden: {}, visible: {} }}
              >
                Elevate Your <span>Minecraft</span> Experience
              </motion.h2>

              <motion.p
                className="text-sm md:text-base mb-6 text-gray-600 max-w-md"
                variants={{ hidden: {}, visible: {} }}
              >
                Premium capes that are no longer obtainable anywhere else… grab
                these exclusive, limited-edition capes to make your Minecraft
                character stand out.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                variants={{ hidden: {}, visible: {} }}
              >
                <motion.button
                  className="minecraft-btn relative overflow-hidden px-6 py-2.5 rounded-lg bg-green-500 text-white font-semibold shadow-lg"
                  whileHover={{
                    scale: 1.05,
                    boxShadow: "0 12px 24px rgba(0,0,0,0.2)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/shop")}
                >
                  Shop Now
                </motion.button>
                <motion.button
                  className="px-5 py-2.5 rounded-lg bg-white border-2 border-[var(--primary)] text-[var(--primary)] font-medium shadow-md"
                  whileHover={{
                    scale: 1.05,
                    borderColor: "var(--primary-dark)",
                    color: "var(--primary-dark)",
                    boxShadow: "0 8px 20px rgba(34,197,94,0.2)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    window.open("https://discord.mccapes.net", "_blank")
                  }
                >
                  Discord
                </motion.button>
              </motion.div>
            </motion.div>

            {/* RIGHT: BLOB IMAGE */}
            {isMobile ? (
              // --- MOBILE: just center the image, no animations ---
              <div className="w-full h-[300px] flex justify-center items-center">
                <div className="relative w-3/4 h-full">
                  <Image
                    src="/images/hero.webp"
                    alt="Minecraft Character with Premium Cape"
                    fill
                    style={{ objectFit: "contain" }}
                    className="scale-150"
                    priority
                  />
                </div>
              </div>
            ) : (
              // --- DESKTOP: full motion-div with drag/hover etc. ---
              <motion.div
                className="w-full md:w-1/2 flex justify-center"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0, scale: 1.1 }}
                transition={{ delay: 0.3, duration: 1 }}
              >
                <motion.div
                  className="relative w-[110%] md:w-[120%] lg:w-[130%] h-[400px] md:h-[500px] lg:h-[650px] overflow-visible transform -translate-x-4"
                  whileHover={{ scale: 1.05, rotate: 2 }}
                  whileTap={{ scale: 0.98 }}
                  drag
                  dragElastic={0.2}
                  dragConstraints={{ top: 0, bottom: 0, left: 0, right: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                >
                  <Image
                    src="/images/hero.webp"
                    alt="Minecraft Character with Premium Cape"
                    fill
                    style={{ objectFit: "contain" }}
                    className="scale-110"
                    priority
                  />
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* ABOUT US CARD SECTION */}
          <motion.div
            className="mt-24 bg-gradient-to-br from-[#d8e8e1] to-[#b8d1c6] rounded-2xl p-10 shadow-xl overflow-hidden relative"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-green-700"
                  style={{
                    width: 20 + Math.random() * 100,
                    height: 20 + Math.random() * 100,
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    x: [0, Math.random() * 60 - 30],
                    y: [0, Math.random() * 60 - 30],
                    scale: [1, 1 + Math.random() * 0.3],
                    opacity: [0.6, 0.9, 0.6],
                  }}
                  transition={{
                    duration: 8 + Math.random() * 7,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
              {/* LEFT SIDE: ABOUT TEXT */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                <motion.h2
                  className="text-5xl font-bold mb-6 text-gray-800 relative inline-block"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  About us
                  <motion.div
                    className="absolute -bottom-2 left-0 h-1.5 bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                  />
                </motion.h2>
                <motion.p
                  className="text-gray-700 text-lg leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.7 }}
                >
                  MC Capes is the{" "}
                  <span className="text-green-600 font-semibold">
                    #1 online Minecraft cape shop
                  </span>
                  . We verify that our cape codes are 100% legitimate before
                  sending them to our customers and strive to achieve customer
                  satisfaction. We attend the Minecraft Experience event in
                  person to get our cape codes and don&apos;t sell any
                  second-hand cape codes.
                </motion.p>
              </motion.div>

              {/* RIGHT SIDE: FEATURES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* INSTANT DELIVERY */}
                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <motion.div
                    className="p-4 bg-white bg-opacity-80 rounded-xl border border-green-100 shadow-md group-hover:shadow-green-200 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-green-600 group-hover:text-green-500 transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                      Instant Delivery
                    </h3>
                    <p className="text-gray-600 mt-1 group-hover:text-gray-800 transition-colors duration-300">
                      All our cape codes are delivered instantly upon purchase.
                      There is no need to wait for your code.
                    </p>
                  </div>
                </motion.div>

                {/* SECURE PAYMENTS */}
                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <motion.div
                    className="p-4 bg-white bg-opacity-80 rounded-xl border border-green-100 shadow-md group-hover:shadow-green-200 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-green-600 group-hover:text-green-500 transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                      Secure Payments
                    </h3>
                    <p className="text-gray-600 mt-1 group-hover:text-gray-800 transition-colors duration-300">
                      All payments are made with card and securely processed
                      through stripe to ensure that all data is safe.
                    </p>
                  </div>
                </motion.div>

                {/* 24/7 SUPPORT */}
                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <motion.div
                    className="p-4 bg-white bg-opacity-80 rounded-xl border border-green-100 shadow-md group-hover:shadow-green-200 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-green-600 group-hover:text-green-500 transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                      24/7 Support
                    </h3>
                    <p className="text-gray-600 mt-1 group-hover:text-gray-800 transition-colors duration-300">
                      Join our discord server for 24/7 support from our
                      dedicated staff if you have any issues with your order.
                    </p>
                  </div>
                </motion.div>

                {/* RARE CAPES */}
                <motion.div
                  className="flex items-start gap-4 group"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                >
                  <motion.div
                    className="p-4 bg-white bg-opacity-80 rounded-xl border border-green-100 shadow-md group-hover:shadow-green-200 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-7 w-7 text-green-600 group-hover:text-green-500 transition-colors duration-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </motion.div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
                      Rare Capes
                    </h3>
                    <p className="text-gray-600 mt-1 group-hover:text-gray-800 transition-colors duration-300">
                      We offer some of Minecraft&apos;s most difficult to find
                      capes for an affordable price.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Minecraft-style animated border */}
            <motion.div
              className="absolute inset-0 pointer-events-none border-4 border-green-500 rounded-2xl opacity-0"
              animate={{
                opacity: [0, 0.2, 0],
                scale: [0.95, 1.02, 0.95],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
