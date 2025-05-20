"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import { useTRPC } from "@/server/client";
import ArticleSection from "@/views/homepage/ArticleSection";
import HeroSection from "@/views/homepage/HeroSection";
import PartnerScroller from "@/views/homepage/PartnerScroll";
import TopProductsSection from "@/views/homepage/TopProductsSection";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

// Featured product articles
const productArticles = [
  {
    id: 1,
    title: "Diamond Collection",
    description:
      "Elevate your Minecraft style with our premium Diamond Collection, featuring rare glowing capes woven from the finest virtual diamonds. Each cape comes alive with subtle particle effects that shimmer and trail behind you as you move, ensuring all eyes are on you in any server.\n\nCrafted with meticulous attention to detail, the animation cycles smoothly through every angle, creating an otherworldly aura that distinguishes the true Minecraft elite. Our designers have spent countless hours perfecting each pixel to ensure that these capes don't just look impressive—they make a statement about your dedication to the game.\n\nPerformance is never compromised with our Diamond Collection. Unlike many custom cosmetics that cause lag and frame drops, our capes are optimized to maintain smooth gameplay even in the most resource-intensive situations. This technical excellence comes from our proprietary rendering engine that balances visual fidelity with performance.\n\nThe Diamond Collection includes five distinct variants, each with its own unique particle effects and color gradients. From the cool azure flows of the Ocean Diamond to the fierce crimson pulses of the Nether Diamond, there's a style to match any skin or gameplay preference. Collectors will appreciate the limited availability of these designs, as each seasonal release is capped to ensure exclusivity.\n\nOwning a Diamond Cape isn't just about aesthetics—it's about joining an exclusive community of players who appreciate fine craftsmanship in the Minecraft universe. Cape owners receive access to our private Discord server where they can connect with like-minded enthusiasts and get early previews of upcoming collections.\n\nThe history of our Diamond Collection dates back to the early days of Minecraft customization. What began as a passion project among a small group of texture artists has evolved into the gold standard for premium Minecraft accessories. Each design iteration has been refined through extensive community feedback, ensuring that every cape meets the exacting standards of even the most discerning players.\n\nWe source our visual inspiration from both in-game elements and real-world phenomena. The Aurora Diamond cape, for instance, draws from the mesmerizing patterns of the northern lights, translating those ethereal waves into flowing diamond particles that cascade down your back. The Volcanic Diamond design captures the intense energy of lava flows, with orange-red embers that pulse with increasing intensity during combat or sprinting activities.\n\nFor those concerned about visibility in competitive play, we've implemented a stealth mode option that reduces particle intensity during PvP engagements, ensuring that your aesthetic choices never come at the cost of gameplay advantage. This feature can be toggled through our companion app, which also allows for detailed customization of particle colors and densities.\n\nThe Diamond Collection has been endorsed by some of the most prominent Minecraft content creators, many of whom have collaborated with us on exclusive design variants. These limited edition pieces often sell out within hours of release, becoming coveted status symbols within the community. Our authentication system ensures that each cape is uniquely tied to your account, preventing duplication and maintaining the value of your investment.\n\nWhether you're showcasing your cape in creative builds, survival adventures, or competitive minigames, the Diamond Collection ensures you'll always stand out as a player of distinction and taste. In a world where everyone is building their own identity, make yours unforgettable.",
    video: "https://www.youtube.com/embed/878YHLzJmF4",
    color: "var(--primary)",
    alignment: "left", // Image on right
    productSlug: "founders-cape"
  },
  {
    id: 2,
    title: "Emerald Armor Series",
    description:
      "Step into battle with confidence in our exclusive Emerald Armor Series, where each piece of gear boasts a rich, gleaming emerald finish that catches the light in every direction. Subtle, dynamic particle accents highlight critical areas—like the shoulder plates and helmet crest—bringing a living, breathing look to your armor.\n\nEach armor piece has been meticulously designed by our team of veteran Minecraft artists who understand that true immersion comes from attention to detail. The emerald textures have been crafted to reflect light dynamically based on your movement and surroundings, creating an ever-changing visual experience that will never grow stale.\n\nWhat truly sets our Emerald Armor apart is the custom sound design. When you equip a piece, you'll hear the distinctive sound of ancient tomes being unlocked and emerald veins being discovered. When taking damage, the armor responds with unique audio cues that add another layer of immersion to your gameplay. These sounds have been engineered to be noticeable without being distracting, enhancing rather than interrupting your experience.\n\nCompatibility is at the core of our design philosophy. We've extensively tested the Emerald Armor Series with all major Minecraft mods and resource packs to ensure seamless integration with your existing setup. Whether you're running vanilla or a heavily modded instance, our armor will render beautifully without conflicts or visual glitches.\n\nThe Emerald Armor Series includes the complete set—helmet, chestplate, leggings, and boots—each available individually or as a discounted complete collection. For the true enthusiasts, our Emerald+ tier includes exclusive enchantment glint variations that are unavailable anywhere else, letting you truly stand out even among other Emerald Armor wearers.\n\nThe lore behind our Emerald Armor runs deep into Minecraft's history. According to our narrative designers, these armor pieces were forged by ancient villager smiths who discovered a method to infuse emeralds with the essence of guardian crystals, creating armor with both dazzling appearance and exceptional durability. This backstory is reflected in subtle design elements throughout the set, from the faint etching of villager runes on the inner plates to the guardian-inspired geometry of the helmet's crest.\n\nWearing the full Emerald set activates special visual interactions between pieces. The shoulder pauldrons occasionally send pulses of energy down the chestplate, while the boots leave temporary emerald footprints when walking on certain surfaces. These integrated effects create a cohesive visual story that makes the complete set greater than the sum of its parts.\n\nFor creators and streamers, the Emerald Armor offers unique content opportunities. The way the armor catches and reflects light makes for spectacular screenshots, especially in custom-built environments with dramatic lighting. Many professional Minecraft photographers have praised the set for how it enhances their compositional possibilities and creates striking focal points in their work.\n\nBy popular demand, we've developed specialized Emerald Armor variants for different playstyles. The Hunter variant features a darker green palette with muted particle effects for those who prefer stealth gameplay, while the Champion variant amplifies the particle effects and adds golden accents for players who want maximum visual impact during tournaments or ceremonial events.\n\nThe durability of our digital products is unmatched—your Emerald Armor purchase includes lifetime updates as Minecraft evolves. When texture systems change or new game versions are released, our team works tirelessly to ensure your armor remains compatible and visually stunning, making this not just a purchase but a long-term investment in your Minecraft identity.",
    video: "https://www.youtube.com/embed/878YHLzJmF4",
    color: "var(--accent)",
    alignment: "right", // Image on left
    productSlug: "tiktok-cape"
  },
  {
    id: 3,
    title: "Dragon Wings Collection",
    description:
      "Unleash the power of draconic flight with our Dragon Wings Collection—majestic, animated accessories that react to your every turn and jump. Realistic flame effects flicker along the edges of each feather, intensifying as you sprint or glide, while dynamic articulation ensures each wingbeat feels weighty and authentic.\n\nInspired by the ancient dragons of Minecraft lore, each wing design in our collection represents a different dragon species with its own unique characteristics. The Ender Dragon wings feature subtle purple particle effects that echo the mysterious energy of the End dimension, while the Frost Dragon wings leave a trail of snow particles and shimmer with an icy blue luminescence that's visible even in the darkest caves.\n\nThe technical achievement behind these wings cannot be overstated. Our animation system uses advanced physics calculations to create natural movement that responds to your character's actions. When you sprint, the wings extend fully and beat more rapidly; when you sneak, they fold closer to your body; and when you jump, they spread wide to catch the air. This attention to movement detail creates an unparalleled level of immersion.\n\nWe understand that sometimes wings can get in the way of visibility, especially in tight spaces or during intense building sessions. That's why we've implemented an intuitive hotkey system that allows you to toggle your wings on and off with a simple keystroke. No more navigating through menus or disconnecting to change your appearance—just seamless control over your draconic presence.\n\nThe Dragon Wings Collection represents the pinnacle of Minecraft cosmetic accessories. Each pair of wings is a statement piece that transforms not just how you look, but how you experience the game. Soar above your enemies, dive into battle with spectacular effects, or simply glide peacefully across your world—with these wings, every moment becomes more epic.\n\nThe development of our Dragon Wings Collection represents over three years of research and innovation. Our team studied the flight patterns of various birds and bats, as well as the mythological representations of dragons across different cultures, to create wing animations that feel both fantastical and physically plausible. This attention to natural movement is what makes our wings feel like true extensions of your character rather than mere decorative additions.\n\nOur exclusive wing-adaptive texture technology ensures that your dragon wings interact with the environment around you. When flying through rain or snow, droplets will collect momentarily on the wing surface before sliding off in a realistic manner. When soaring near lava or fire, the wings will reflect the orange glow and show subtle heat distortion effects along the edges. These environmental interactions create a dynamic accessory that feels alive and responsive.\n\nSound design plays a crucial role in the immersive experience of our Dragon Wings. Each wing type has its own unique audio profile—from the thunderous beats of the Storm Dragon wings to the whisper-quiet susurration of the Shadow Dragon variant. These sounds are spatially aware, meaning other players can hear your approach from the appropriate direction, adding both strategic gameplay elements and atmospheric richness to your presence.\n\nFor creative builders and screenshot artists, we've included a pose mode feature that allows you to manually adjust your wing position and spread for perfect composition. This feature has made our Dragon Wings Collection particularly popular among machinima creators and storytellers who need precise control over their character's appearance for narrative sequences.\n\nThe social impact of Dragon Wings cannot be understated. Since their introduction, they have become symbols of prestige and achievement within various Minecraft communities. Some server networks have even integrated our wings API to grant special wing variants as rewards for tournaments or community contributions, creating digital trophies that players can proudly display throughout their Minecraft journey.\n\nAs with all our premium accessories, the Dragon Wings Collection comes with dedicated customer support and regular updates. Our team of artists continually refines textures and animations based on community feedback, ensuring that your wings remain cutting-edge even as Minecraft evolves. This commitment to product longevity has earned us the loyalty of players who recognize that true quality deserves ongoing care and attention.",
    video: "https://www.youtube.com/embed/878YHLzJmF4",
    color: "var(--secondary)",
    alignment: "left", // Image on right
    productSlug: "experience-cape"
  },
];

const HomePage = () => {
  const trpc = useTRPC();
  const { data: products } = useQuery(trpc.product.getAll.queryOptions({ isHomePage: true }));

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* 1. Header with clean, light design */}
      <header className="py-8 flex items-center justify-center relative flex-col">
        <Navbar />

        <HeroSection />
      </header>

      {/* 3. Product Article Sections */}
      {productArticles.map((article, index) => (
        <ArticleSection
          key={index}
          index={index}
          alignment={article.alignment as "left" | "right"}
          description={article.description}
          title={article.title}
          video={article.video}
          productSlug={article.productSlug}
        />
      ))}

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