"use client";

import { useTRPC } from "@/server/client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ReactNode, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { FaLock } from "react-icons/fa";
import AdminLayout from "./admin/AdminLayout";
import { AdminProvider } from "@/contexts/AdminContext";

export default function AdminWrapper({
  children,
  setCurrentTab,
  currentTab = "dashboard",
}: {
  children: ReactNode;
  setCurrentTab?: (tab: string) => void;
  currentTab?: string;
}) {
  const trpc = useTRPC();

  const [password, setPassword] = useState("");
  const [isPasswordIncorrect, setIsPasswordIncorrect] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "support" | null>(null);

  const isAuthenticated = useQuery(trpc.auth.isAuthenticated.queryOptions());

  const login = useMutation(
    trpc.auth.authenticate.mutationOptions({
      onSuccess: (data) => {
        setIsPasswordIncorrect(false);
        setUserRole(data.role);
        toast.success("Authenticated successfully");
      },
      onError: (error) => {
        setIsPasswordIncorrect(true);
        toast.error(`Error authenticating: ${error.message}`);
      },
      onSettled: () => {
        isAuthenticated.refetch();
      },
    }),
  );

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    login.mutate({
      password: password,
    });
  };

  // Update role when authentication status changes
  const authRole = isAuthenticated.data?.role as "admin" | "support" | null | undefined;
  useEffect(() => {
    if (authRole !== undefined) {
      setUserRole(authRole);
    }
  }, [authRole]);

  const authComponent = (
    <AnimatePresence>
      {!isAuthenticated.isLoading &&
        (!isAuthenticated.data ||
          (typeof isAuthenticated.data === "object" &&
            "authenticated" in isAuthenticated.data &&
            !isAuthenticated.data.authenticated)) && (
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
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_10%)] p-8 shadow-2xl"
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
                  className={`w-full rounded-lg border bg-[color-mix(in_srgb,var(--surface),#000_6%)] p-3 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] ${
                    isPasswordIncorrect
                      ? "border-red-500"
                      : "border-[var(--border)]"
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

  const isAuth =
    isAuthenticated.data?.authenticated === true;

  return (
    <AdminProvider userRole={userRole}>
      <AdminLayout
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isAuthenticated={isAuth}
        authComponent={authComponent}
        userRole={userRole}
      >
        {children}
      </AdminLayout>
    </AdminProvider>
  );
}
