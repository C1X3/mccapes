'use client';

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import FAQSection from "@/components/FAQSection";
import { Product } from "@generated";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowLeft, FaStar, FaMinus, FaPlus, FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

const ProductPage = ({ product, stockCount }: { product?: Product, stockCount?: number }) => {
    const router = useRouter();
    const { addItem } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(product?.image || '');
    const [isAdding, setIsAdding] = useState(false);

    const handleIncrementQuantity = () => {
        if (product && quantity < stockCount!) {
            setQuantity(prev => prev + 1);
        }
    };

    const handleDecrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;

        setIsAdding(true);
        addItem({ ...product, stock: stockCount || 0 }, quantity);
        setIsAdding(false);
    };

    const handleBuyNow = () => {
        if (!product) return;

        addItem({ ...product, stock: stockCount || 0 }, quantity);

        router.push('/cart');
    };

    if (!product) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Product not found</h2>
                    <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] mb-6">
                        The product you&apos;re looking for doesn&apos;t exist or has been removed.
                    </p>
                    <button
                        onClick={() => router.push('/shop')}
                        className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors"
                    >
                        Return to Shop
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            <header className="py-8 flex items-center justify-center relative flex-col">
                <Navbar />
            </header>

            <main className="container mx-auto px-4 py-12">
                {/* Back button */}
                <button
                    onClick={() => router.push('/shop')}
                    className="mb-8 flex items-center gap-2 text-[color-mix(in_srgb,var(--foreground),#888_40%)] hover:text-[var(--accent)] transition-colors"
                >
                    <FaArrowLeft size={14} />
                    <span>Back to Shop</span>
                </button>

                {/* Product details */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product images */}
                    <div>
                        <div className="mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--primary),#fff_90%)] to-[color-mix(in_srgb,var(--secondary),#fff_90%)] p-8 h-[400px] flex items-center justify-center">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative w-full h-full"
                            >
                                <Image
                                    src={selectedImage}
                                    alt={product.name}
                                    fill
                                    style={{ objectFit: "cover" }}
                                    className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]"
                                />
                            </motion.div>
                        </div>

                        {/* Thumbnail images */}
                        <div className="flex gap-4 mt-4">
                            <button
                                className={`border-2 rounded-lg overflow-hidden w-24 h-24 flex items-center justify-center ${selectedImage === product.image ? 'border-[var(--accent)]' : 'border-transparent'}`}
                                onClick={() => setSelectedImage(product.image)}
                            >
                                <Image
                                    src={product.image}
                                    alt={`${product.name} thumbnail`}
                                    width={80}
                                    height={80}
                                    style={{ objectFit: "contain" }}
                                />
                            </button>

                            {product.additionalImages?.map((img, index) => (
                                <button
                                    key={index}
                                    className={`border-2 rounded-lg overflow-hidden w-24 h-24 flex items-center justify-center ${selectedImage === img ? 'border-[var(--accent)]' : 'border-transparent'}`}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <Image
                                        src={img}
                                        alt={`${product.name} alternative view ${index + 1}`}
                                        width={80}
                                        height={80}
                                        style={{ objectFit: "contain" }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Product information */}
                    <div>
                        <div className="mb-4">
                            <span className="inline-block px-3 py-1 bg-[color-mix(in_srgb,var(--background),#333_15%)] text-[var(--foreground)] text-xs font-medium rounded-full">
                                {product.category}
                            </span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
                            {product.name}
                        </h1>

                        <div className="flex items-center mb-6">
                            <div className="flex text-yellow-400 mr-3">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} size={16} className={i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-600"} />
                                ))}
                            </div>
                            <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">{product.rating} rating</span>
                        </div>

                        <div className="text-3xl font-bold text-[var(--foreground)] mb-6">
                            ${product.price.toFixed(2)}
                            {product.slashPrice && <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">${product.slashPrice.toFixed(2)}</span>}
                        </div>

                        <div className="mb-6">
                            <p className="text-[var(--foreground)] mb-4">
                                {product.description}
                            </p>

                            <ul className="space-y-2">
                                {product.features?.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-[color-mix(in_srgb,var(--foreground),#888_20%)]">
                                        <span className="text-[var(--accent)] mt-1">•</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mb-6">
                            <div className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] mb-2">
                                Availability:
                                <span className={`ml-2 font-medium ${stockCount! > 10 ? 'text-green-500' : stockCount! > 0 ? 'text-orange-500' : 'text-red-500'}`}>
                                    {stockCount! > 10 ? 'In Stock' : stockCount! > 0 ? 'Low Stock' : 'Out of Stock'}
                                </span>
                            </div>
                            <div className="text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                {stockCount! > 0 ? `${stockCount} units remaining` : 'Currently unavailable'}
                            </div>
                        </div>

                        {stockCount! > 0 && (
                            <div className="mb-8">
                                <div className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] mb-2">
                                    Quantity:
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center">
                                        <button
                                            onClick={handleDecrementQuantity}
                                            disabled={quantity <= 1}
                                            className="
                                                    h-10 w-10 
                                                    flex items-center justify-center 
                                                    bg-[color-mix(in_srgb,var(--background),#333_15%)] 
                                                    rounded-l-lg 
                                                    border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] 
                                                    text-[var(--foreground)] 
                                                    disabled:opacity-50
                                                "
                                        >
                                            <FaMinus size={12} />
                                        </button>
                                        <input
                                            type="number"
                                            min="1"
                                            max={stockCount}
                                            value={quantity}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 1 && val <= stockCount!) {
                                                    setQuantity(val);
                                                }
                                            }}
                                            className="
                                                    h-10 w-16 
                                                    text-center 
                                                    bg-[color-mix(in_srgb,var(--background),#333_15%)] 
                                                    border-t border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] 
                                                    text-[var(--foreground)]
                                                    outline-none
                                                "
                                        />
                                        <button
                                            onClick={handleIncrementQuantity}
                                            disabled={quantity >= stockCount!}
                                            className="
                                                    h-10 w-10 
                                                    flex items-center justify-center 
                                                    bg-[color-mix(in_srgb,var(--background),#333_15%)] 
                                                    rounded-r-lg 
                                                    border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] 
                                                    text-[var(--foreground)] 
                                                    disabled:opacity-50
                                                "
                                        >
                                            <FaPlus size={12} />
                                        </button>
                                    </div>
                                    <div className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm">
                                        {stockCount! < 10 && `Only ${stockCount} available`}
                                    </div>
                                </div>
                            </div>
                        )}


                        <div className="flex flex-col sm:flex-row gap-4">
                            <motion.button
                                onClick={handleAddToCart}
                                disabled={stockCount! <= 0 || isAdding}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAdding ? (
                                    <span>Adding...</span>
                                ) : (
                                    <>
                                        <FaShoppingCart size={16} />
                                        <span>Add to Cart</span>
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                onClick={handleBuyNow}
                                disabled={stockCount! <= 0}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex-1 px-6 py-3 bg-[var(--accent)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--accent),#000_10%)] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Buy Now
                            </motion.button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Customer Stats Section */}
            <div className="container mx-auto px-4 pb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Our Customers</span>
                    </h2>
                    <p className="text-gray-600">
                        Join thousands of satisfied Minecraft players worldwide
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-effect rounded-xl p-8 text-center">
                        <div className="text-5xl font-bold text-[var(--foreground)] mb-2">4,189</div>
                        <div className="text-gray-600 font-medium">Products Sold</div>
                    </div>
                    <div className="glass-effect rounded-xl p-8 text-center">
                        <div className="text-5xl font-bold text-[var(--foreground)] mb-2">4,189</div>
                        <div className="text-gray-600 font-medium">Happy Customers</div>
                    </div>
                    <div className="glass-effect rounded-xl p-8 text-center">
                        <div className="flex items-center justify-center mb-2">
                            <span className="text-5xl font-bold text-[var(--foreground)] mr-2">4.99</span>
                            <FaStar className="text-yellow-400" size={28} />
                        </div>
                        <div className="text-gray-600 font-medium">Average Rating</div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className="container mx-auto px-4 pb-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-2">
                        <span className="gradient-text">Frequently Asked Questions</span>
                    </h2>
                    <p className="text-gray-600">
                        Find answers to common questions about our services
                    </p>
                </div>
                <FAQSection showTitle={false} showContactButtons={false} />
            </div>

            <Footer />
        </div>
    );
};

export default ProductPage;