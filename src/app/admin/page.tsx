"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaPlus, FaEye, FaLock } from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import { toast } from "react-hot-toast";
import ProductFormModal, { ProductFormModalSchema } from "@/components/admin/ProductFormModal";
import { Product } from "@generated";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";

export default function AdminDashboard() {
    const [password, setPassword] = useState("");
    const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductFormModalSchema | undefined>(undefined);

    const router = useRouter();
    const trpc = useTRPC();

    // tRPC product hooks
    const isAuthenticated = useQuery(trpc.auth.isAuthenticated.queryOptions());
    const login = useMutation(trpc.auth.authenticate.mutationOptions({
        onSuccess: () => {
            setIsPasswordIncorrect(false);
            toast.success("Authenticated successfully");
        },
        onError: (error) => {
            setIsPasswordIncorrect(true);
            toast.error(`Error authenticating: ${error.message}`);
        },
        onSettled: () => {
            isAuthenticated.refetch();
        },
    }));
    const products = useQuery(trpc.product.getAllWithStock.queryOptions());
    const deleteProductMutation = useMutation(trpc.product.delete.mutationOptions({
        onSuccess: () => {
            toast.success("Product deleted successfully");
            products.refetch();
        },
        onError: (error) => {
            toast.error(`Error deleting product: ${error.message}`);
        },
    }));

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        login.mutate({
            password: password,
        });
    };

    const handleDeleteProduct = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            deleteProductMutation.mutate({ id });
        }
    };

    const handleEditProduct = (product: Product) => {
        const formProduct: ProductFormModalSchema = {
            id: product.id,
            slug: product.slug || "",
            name: product.name,
            description: product.description,
            price: product.price,
            stock: product.stock,
            image: product.image,
            additionalImages: product.additionalImages,
            category: product.category,
            badge: product.badge || undefined,
            rating: product.rating,
            features: product.features,
            slashPrice: product.slashPrice || 0,
            hideHomePage: product.hideHomePage || false,
            hideProductPage: product.hideProductPage || false,
            isFeatured: product.isFeatured || false
        };
        setSelectedProduct(formProduct);
        setIsEditModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {/* Toast notifications */}
            <header className="py-8 flex items-center justify-center relative flex-col">
                <Navbar />
            </header>

            <main className="container mx-auto px-4 py-12">
                {/* Password Dialog */}
                <AnimatePresence>
                    {!isAuthenticated.isLoading && isAuthenticated.data === false && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-[var(--background)] rounded-2xl p-8 max-w-md w-full shadow-2xl"
                            >
                                <div className="flex items-center justify-center mb-6">
                                    <div className="bg-[var(--primary)] w-16 h-16 rounded-full flex items-center justify-center text-white">
                                        <FaLock size={24} />
                                    </div>
                                </div>

                                <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-6">
                                    Admin Authentication
                                </h2>

                                <form onSubmit={handlePasswordSubmit}>
                                    <div className="mb-6">
                                        <label
                                            htmlFor="password"
                                            className="block text-[var(--foreground)] mb-2"
                                        >
                                            Password
                                        </label>
                                        <input
                                            type="password"
                                            id="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`w-full p-3 bg-[color-mix(in_srgb,var(--background),#333_15%)] border rounded-lg text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${isPasswordIncorrect
                                                ? "border-red-500"
                                                : "border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]"
                                                }`}
                                            placeholder="Enter admin password"
                                        />
                                        {isPasswordIncorrect && (
                                            <p className="text-red-500 text-sm mt-2">
                                                Incorrect password. Please try again.
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={login.isPending}
                                        className="w-full px-6 py-3 bg-[var(--primary)] text-white rounded-xl hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {login.isPending ? "Authenticating..." : "Login"}
                                    </button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                    {isAuthenticated.isLoading && (
                        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Product Form Modals */}
                <AnimatePresence>
                    {isAddModalOpen && (
                        <ProductFormModal
                            isOpen={isAddModalOpen}
                            onClose={() => setIsAddModalOpen(false)}
                            onSuccess={() => products.refetch()}
                        />
                    )}

                    {isEditModalOpen && selectedProduct && (
                        <ProductFormModal
                            isOpen={isEditModalOpen}
                            onClose={() => {
                                setIsEditModalOpen(false);
                                setSelectedProduct(undefined);
                            }}
                            initialData={selectedProduct}
                            isEditing={true}
                            onSuccess={() => products.refetch()}
                        />
                    )}
                </AnimatePresence>

                {/* Admin Dashboard Content */}
                {isAuthenticated && (
                    <>
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-3xl font-bold text-[var(--foreground)]">
                                Admin Dashboard
                            </h1>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[color-mix(in_srgb,var(--primary),#000_10%)] transition-colors flex items-center gap-2"
                            >
                                <FaPlus size={14} />
                                <span>Add Product</span>
                            </button>
                        </div>

                        <div className="bg-[color-mix(in_srgb,var(--background),#333_15%)] p-6 rounded-xl border border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
                            <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                                Products Management
                            </h2>

                            {products.isLoading ? (
                                <div className="flex justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                                </div>
                            ) : products.error ? (
                                <div className="text-red-500 text-center py-8">
                                    Error loading products: {products.error.message}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)]">
                                                <th className="text-left py-4 px-2 text-[var(--foreground)]">
                                                    ID
                                                </th>
                                                <th className="text-left py-4 px-2 text-[var(--foreground)]">
                                                    Name
                                                </th>
                                                <th className="text-left py-4 px-2 text-[var(--foreground)]">
                                                    Category
                                                </th>
                                                <th className="text-left py-4 px-2 text-[var(--foreground)]">
                                                    Price
                                                </th>
                                                <th className="text-left py-4 px-2 text-[var(--foreground)]">
                                                    Stock
                                                </th>
                                                <th className="text-right py-4 px-2 text-[var(--foreground)]">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!products.error && products.data?.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="border-b border-[color-mix(in_srgb,var(--foreground),var(--background)_95%)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)]"
                                                >
                                                    <td className="py-4 px-2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                                        {product.id.substring(0, 8)}...
                                                    </td>
                                                    <td className="py-4 px-2 text-[var(--foreground)]">
                                                        {product.name}
                                                    </td>
                                                    <td className="py-4 px-2 text-[color-mix(in_srgb,var(--foreground),#888_40%)]">
                                                        {product.category}
                                                    </td>
                                                    <td className="py-4 px-2 text-[var(--foreground)]">
                                                        ${product.price.toFixed(2)}
                                                    </td>
                                                    <td className="py-4 px-2 text-[var(--foreground)]">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs ${product.stock.length > 10
                                                                ? "bg-green-100 text-green-800"
                                                                : product.stock.length > 0
                                                                    ? "bg-orange-100 text-orange-800"
                                                                    : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {product.stock.length}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-2 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => router.push(`/shop/${product.slug}`)}
                                                                className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                                                                title="View Product"
                                                            >
                                                                <FaEye size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleEditProduct(product)}
                                                                className="p-2 bg-amber-100 text-amber-600 rounded hover:bg-amber-200 transition-colors"
                                                                title="Edit Product"
                                                            >
                                                                <FaEdit size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                                                                title="Delete Product"
                                                            >
                                                                <FaTrash size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
