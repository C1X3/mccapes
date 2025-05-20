import { motion } from "framer-motion";
import Image from "next/image";
import { FaStar, FaShoppingCart } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { ProductGetAllOutput } from "@/server/routes/_app";

const ProductCard = ({ product }: { product: ProductGetAllOutput[number] }) => {
    const router = useRouter();
    const { addItem } = useCart();

    const handleNavigateToProduct = () => {
        router.push(`/shop/${product.slug}`);
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.stopPropagation();
        addItem(product);
    };

    return (
        <motion.div
            key={product.id}
            className="group bg-gradient-to-b from-[color-mix(in_srgb,var(--background),#333_15%)] to-[var(--background)] rounded-2xl overflow-hidden border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] hover:border-[var(--accent)] backdrop-blur-sm transition-all duration-300 cursor-pointer"
            variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
            }}
            whileHover={{
                y: -8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                borderColor: "var(--accent)"
            }}
            onClick={handleNavigateToProduct}
        >
            {/* Image with hover and full-fill effect */}
            <div className="relative h-60 overflow-hidden bg-gradient-to-br from-[color-mix(in_srgb,var(--primary),#fff_80%)] to-[color-mix(in_srgb,var(--secondary),#fff_80%)] bg-opacity-10">
                <motion.div
                    className="absolute inset-0"
                    whileHover={{ scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                >
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        style={{ objectFit: "cover" }}
                        className="drop-shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]"
                    />
                </motion.div>
                {product.badge && <div className="absolute top-3 left-3 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white text-xs font-bold px-3 py-1 rounded-full">
                    {product.badge}
                </div>}
            </div>


            {/* Content */}
            <div className="p-6">
                <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400 mr-2">
                        {[...Array(5)].map((_, i) => (
                            <FaStar key={i} size={12} className={i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-600"} />
                        ))}
                    </div>
                    <span className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-xs">{product.rating}</span>
                </div>
                <h4 className="text-lg font-bold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors">
                    {product.name}
                </h4>
                <p className="text-[color-mix(in_srgb,var(--foreground),#888_40%)] text-sm mb-4 line-clamp-2">
                    {product.description}
                </p>
                <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[var(--foreground)]">
                        ${product.price}
                        {product.slashPrice && <span className="text-[color-mix(in_srgb,var(--foreground),#888_60%)] ml-2 line-through">${product.slashPrice.toFixed(2)}</span>}
                    </span>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            className="p-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center"
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="flex items-center"
                            >
                                <FaShoppingCart size={16} />
                            </motion.div>
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-2.5 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/shop/${product.slug}`);
                            }}
                        >
                            <span className="text-sm font-semibold">View</span>
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;