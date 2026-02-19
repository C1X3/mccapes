"use client";

import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ),
    title: "Instant Delivery",
    description: "Cape codes delivered instantly upon purchase — no waiting.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
    title: "Secure Payments",
    description: "All payments processed securely through Stripe.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    ),
    title: "24/7 Support",
    description: "Dedicated staff available around the clock on Discord.",
  },
  {
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    ),
    title: "Rare Capes",
    description: "Minecraft's rarest capes at affordable prices.",
  },
];

const AboutHeroSection = () => {
  return (
    <section className="relative w-full pt-32 pb-32 px-4">
      <div className="container mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
            About Us
          </h1>
          <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-center max-w-6xl mx-auto">
            MC Capes is the{" "}
            <span className="text-[var(--primary)] font-semibold">#1 online Minecraft cape shop</span>.
            We verify that our cape codes are 100% legitimate before sending them to our customers and strive to achieve customer satisfaction. 
            We attend the Minecraft Experience event in person to get our cape codes and don't sell any second-hand cape codes. Founded in December, 
            2024, MC Capes was established in response to a widespread problem in the cape market, aiming to provide a safe environment for users to 
            purchase their cape from. On top of achieving 300+ vouches, we have received many endorsements from the following YouTubers, JudeLow, 
            Flowtives, qBedwars, Dewier, and many more have all partnered with us. They would not have risked their reputation if they did not know 
            for certain we are a legitimate source to obtain your Minecraft cape from. You can find our full list of vouches, partners, and videos we've sponsored below.
          </p>
        </motion.div>

        {/* Feature strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-6xl mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="flex items-start gap-4 group"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <motion.div
                className="shrink-0 p-4 bg-white/80 rounded-xl border border-[color-mix(in_srgb,var(--primary),transparent_80%)] shadow-md group-hover:shadow-lg transition-all duration-300"
                whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[var(--primary)] group-hover:opacity-80 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {f.icon}
                </svg>
              </motion.div>
              <div>
                <h3 className="font-bold text-base text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors duration-300">{f.title}</h3>
                <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mt-1 leading-relaxed group-hover:text-[var(--foreground)] transition-colors duration-300">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutHeroSection;
