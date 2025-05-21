import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const HeroSection = () => {
  const router = useRouter();

  return (
    <div className="relative w-full py-24">
      {/* BACKGROUND ORBS CONTAINER */}
      <div className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => {
          const size = 100 + Math.random() * 200;
          const left = Math.random() * 120 - 10 + "%";
          const top = Math.random() * 120 - 10 + "%";
          // const duration = 8 + Math.random() * 4;
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
                // "--dance-speed": `${duration}s`,
                opacity: 0.1,
              }}
            />
          );
        })}
      </div>

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
                visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.2 } },
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
                Premium capes, skins, and accessories… all handcrafted and brought to life
                with dynamic animations, so your avatar never blends into the crowd.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-4"
                variants={{ hidden: {}, visible: {} }}
              >
                <motion.button
                  className="minecraft-btn relative overflow-hidden px-6 py-2.5 rounded-lg bg-green-500 text-white font-semibold shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 12px 24px rgba(0,0,0,0.2)" }}
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
                  onClick={() => window.open("https://discord.gg/mccapes", "_blank")}
                >
                  Discord
                </motion.button>
              </motion.div>
            </motion.div>

            {/* RIGHT: BLOB IMAGE */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
