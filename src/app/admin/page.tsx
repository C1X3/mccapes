"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/server/client";

// Admin components
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardTab from "@/components/admin/DashboardTab";
import ProductsTab from "@/components/admin/ProductsTab";
import InvoicesTab from "@/components/admin/InvoicesTab";
import CouponsTab from "@/components/admin/CouponsTab";

export default function AdminDashboard() {
    const [password, setPassword] = useState("");
    const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
    const [currentTab, setCurrentTab] = useState("dashboard");

    const trpc = useTRPC();

    // tRPC authentication hooks
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

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        login.mutate({
            password: password,
        });
    };

    // Authentication component
    const authComponent = (
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
    );

    // Render the appropriate tab content
    const renderTabContent = () => {
        switch (currentTab) {
            case "dashboard":
                return <DashboardTab />;
            case "products":
                return <ProductsTab />;
            case "invoices":
                return <InvoicesTab />;
            case "coupons":
                return <CouponsTab />;
            default:
                return <DashboardTab />;
        }
    };

    return (
        <AdminLayout
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            isAuthenticated={isAuthenticated.data === true}
            authComponent={authComponent}
        >
            {renderTabContent()}
        </AdminLayout>
    );
}
