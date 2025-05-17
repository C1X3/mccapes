import ProductCard from "@/components/ProductCard";
import { Product } from "@generated";
import { motion } from "framer-motion";
import Image from "next/image";
import { FaShoppingCart, FaChevronRight, FaStar } from "react-icons/fa";

const topSellingProducts: Partial<Product>[] = [
    {
        id: "test",
        name: "Enchanted Diamond Cape",
        description: "Rare glowing cape with diamond particles effect",
        price: 24.99,
        image: "/images/diamond-cape.svg",
        category: "capes",
        badge: "Popular",
        rating: 4.8,
    },
    {
        id: "test",
        name: "Emerald Armor Skin",
        description: "Turn your armor into gleaming emerald",
        price: 19.99,
        image: "/images/emerald-armor.svg",
        category: "skins",
        badge: "New",
        rating: 4.5,
    },
    {
        id: "test",
        name: "Fiery Dragon Wings",
        description: "Majestic wings with animated flame effects",
        price: 29.99,
        image: "/images/dragon-wings.svg",
        category: "accessories",
        badge: "Best Seller",
        rating: 4.9,
    },
    {
        id: "test",
        name: "Ender Guardian Helmet",
        description: "Limited edition helmet with particle effects",
        price: 15.99,
        image: "/images/ender-helmet.svg",
        category: "accessories",
        badge: "Limited",
        rating: 4.6,
    },
];

const TopProductsSection = () => {
    return (
        <section className="py-24 bg-gradient-to-br from-[var(--background)] to-[color-mix(in_srgb,var(--background),#000_15%)] text-[var(--foreground)] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-[var(--primary)] rounded-full filter blur-[80px]" />
                <div className="absolute bottom-[15%] right-[10%] w-80 h-80 bg-[var(--secondary)] rounded-full filter blur-[100px]" />
                <div className="absolute top-[40%] right-[20%] w-40 h-40 bg-[var(--accent)] rounded-full filter blur-[60px]" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                {/* Header with animation */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block mb-4">
                        <span className="bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white">
                            Customers&apos; Favorites
                        </span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-extrabold mb-4 gradient-text">
                        Top Selling Products
                    </h2>
                    <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] max-w-xl mx-auto text-lg">
                        Exclusive in-game items curated for top Minecraft players
                    </p>
                </motion.div>

                {/* Premium Product Spotlight */}
                <motion.div
                    className="mb-20 bg-gradient-to-r from-[color-mix(in_srgb,var(--background),#333_10%)] to-[color-mix(in_srgb,var(--background),#000_10%)] p-4 md:p-8 rounded-3xl backdrop-blur-sm border border-[color-mix(in_srgb,var(--foreground),var(--background)_80%)]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    <div className="flex flex-col md:flex-row items-center gap-10">
                        <motion.div
                            className="w-full md:w-1/2 relative"
                            whileHover={{ scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        >
                            <div className="aspect-square relative rounded-2xl overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--primary),#fff_80%)] to-[color-mix(in_srgb,var(--secondary),#fff_80%)] bg-opacity-20 p-8">
                                <Image
                                    src={topSellingProducts[2].image || ""}
                                    alt="Featured Product"
                                    fill
                                    style={{ objectFit: "contain" }}
                                    className="p-8 drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]"
                                />
                                <div className="absolute top-4 right-4 bg-[var(--accent)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    FEATURED
                                </div>
                            </div>
                        </motion.div>
                        <div className="w-full md:w-1/2 space-y-6">
                            <h3 className="text-3xl font-bold">{topSellingProducts[2].name}</h3>
                            <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} size={16} className={i < Math.floor(topSellingProducts[2].rating || 5) ? "text-yellow-400" : "text-gray-600"} />
                                    ))}
                                </div>
                                <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">{topSellingProducts[2].rating} (198 reviews)</span>
                            </div>
                            <p className="text-[color-mix(in_srgb,var(--foreground),#888_30%)] text-lg leading-relaxed">
                                {topSellingProducts[2].description}. Our most iconic design, these wings make a statement in any server with realistic
                                flame animation and special particle effects that activate while flying.
                            </p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-3xl font-bold">${topSellingProducts[2].price}</span>
                                    <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">${((topSellingProducts[2].price || 0) * 1.25).toFixed(2)}</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="flex items-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:from-[color-mix(in_srgb,var(--primary),#000_10%)] hover:to-[color-mix(in_srgb,var(--secondary),#000_10%)] text-white font-medium py-3 px-6 rounded-xl shadow-lg shadow-[var(--primary-rgb)]/20"
                                >
                                    <FaShoppingCart size={18} />
                                    Add to Cart
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Product Grid with improved cards */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
                    }}
                >
                    {topSellingProducts.map((product) => (
                        <ProductCard key={product.id} product={product as Product} />
                    ))}
                </motion.div>

                {/* Improved CTA */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(var(--primary-rgb),0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] hover:from-[color-mix(in_srgb,var(--primary),#000_10%)] hover:to-[color-mix(in_srgb,var(--secondary),#000_10%)] text-white font-bold rounded-xl shadow-lg shadow-[var(--primary-rgb)]/30 transition-all"
                    >
                        Explore All Premium Items
                        <FaChevronRight className="ml-2" />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

export default TopProductsSection;