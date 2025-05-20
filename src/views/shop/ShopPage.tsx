"use client";

import { useState, useMemo, useEffect } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import ProductCard from "@/components/ProductCard";
import { FaSearch } from "react-icons/fa";
import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useSearchParams } from "next/navigation";

const ShopPage = () => {
    const searchParams = useSearchParams();
    const trpc = useTRPC();
    const { addItem } = useCart();
    const {
        data: products = [],
        isLoading,
        isError,
        error,
    } = useQuery(trpc.product.getAll.queryOptions({
        isProductPage: true,
    }));

    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Set search query from URL parameter
    useEffect(() => {
        const searchFromUrl = searchParams.get("search");
        if (searchFromUrl) {
            setSearchQuery(searchFromUrl);
        }
    }, [searchParams]);

    const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

    const filteredProducts = useMemo(() => {
        let result = products;

        if (selectedCategory !== "All") {
            result = result.filter((p) => p.category === selectedCategory);
        }
        if (searchQuery.trim() !== "") {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q)
            );
        }

        return result;
    }, [products, selectedCategory, searchQuery]);

    const topProduct = useMemo(() => {
        const featuredProduct = products.find(x => x.isFeatured);
        if (featuredProduct) return featuredProduct;

        return filteredProducts.length > 0 
            ? filteredProducts.sort((a, b) => b.price - a.price)[0]
            : products.length > 0 ? products.sort((a, b) => b.price - a.price)[0] : null;
    }, [filteredProducts, products]);

    const handleAddToCart = () => {
        if (!topProduct) return;
        addItem(topProduct, 1);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Header */}
            <header className="py-8 flex flex-col items-center relative">
                <Navbar />
                <div className="container mx-auto px-4 pt-16 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] mb-4">
                        Our Shop
                    </h1>
                    <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] max-w-2xl mx-auto">
                        Discover our curated collection of high-quality products for every
                        lifestyle.
                    </p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                {/* Premium Product Spotlight */}
                {topProduct && <motion.div
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
                            <div className="w-full aspect-video relative rounded-2xl overflow-hidden 
                                        bg-gradient-to-br 
                                        from-[color-mix(in_srgb,var(--primary),#fff_80%)] 
                                        to-[color-mix(in_srgb,var(--secondary),#fff_80%)] 
                                        bg-opacity-20">
                                <div className="relative h-full w-full mx-auto">
                                    <Image
                                        src={topProduct.image || ""}
                                        alt="Featured Product"
                                        fill
                                        style={{ objectFit: "contain" }}
                                        className="drop-shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]"
                                    />
                                </div>
                                <div className="absolute top-4 right-4 bg-[var(--accent)] text-white px-3 py-1 rounded-full text-sm font-semibold">
                                    FEATURED
                                </div>
                            </div>
                        </motion.div>
                        <div className="w-full md:w-1/2 space-y-6">
                            <h3 className="text-3xl font-bold">{topProduct.name}</h3>
                            <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-2">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} size={16} className={i < Math.floor(topProduct.rating || 5) ? "text-yellow-400" : "text-gray-600"} />
                                    ))}
                                </div>
                                <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">{topProduct.rating} (198 reviews)</span>
                            </div>
                            <p className="text-[color-mix(in_srgb,var(--foreground),#888_30%)] text-lg leading-relaxed">
                                {topProduct.description}. Our most iconic design, these wings make a statement in any server with realistic
                                flame animation and special particle effects that activate while flying.
                            </p>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-3xl font-bold">${topProduct.price}</span>
                                    {topProduct.slashPrice && <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">${topProduct.slashPrice.toFixed(2)}</span>}
                                </div>
                                <motion.button
                                    onClick={handleAddToCart}
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
                </motion.div>}

                {/* Loading & Error States */}
                {isLoading && (
                    <div className="text-center py-20">Loading products…</div>
                )}
                {isError && (
                    <div className="text-center py-20 text-red-500">
                        Error loading products: {error.message}
                    </div>
                )}

                {/* Filters */}
                {!isLoading && !isError && (
                    <div className="mb-12 bg-[color-mix(in_srgb,var(--background),#333_10%)] p-6 rounded-2xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
                        <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                            {/* Category selector */}
                            <div className="flex flex-wrap gap-2">
                                {categories.map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                            ? "bg-[var(--primary)] text-white"
                                            : "bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_25%)]"
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Search bar */}
                            <div className="w-full md:w-72">
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search by name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-[color-mix(in_srgb,var(--background),#333_15%)] border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] rounded-xl text-[var(--foreground)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all outline-none"
                                    />
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                        <FaSearch size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Product Grid */}
                {!isLoading && !isError && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-20">
                                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">
                                    No products found
                                </h3>
                                <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                    Try adjusting your search or filter to find what you&apos;re looking
                                    for.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
};

export default ShopPage;
