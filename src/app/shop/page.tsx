"use client";

import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import ProductCard from "@/components/ProductCard";
import { FaSearch } from "react-icons/fa";
import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";
import { ProductGetAllOutput } from "@/server/routes/_app";

const ShopPage = () => {
    const trpc = useTRPC();
    const {
        data: products = [],
        isLoading,
        isError,
        error,
    } = useQuery(trpc.product.getAll.queryOptions());

    // Local UI state
    const [filteredProducts, setFilteredProducts] = useState<ProductGetAllOutput>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [searchQuery, setSearchQuery] = useState<string>("");

    const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

    useEffect(() => {
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

        setFilteredProducts(result);
    }, [products, selectedCategory, searchQuery]);

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
                                    Try adjusting your search or filter to find what you’re looking
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
