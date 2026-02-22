import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  FaBox,
  FaReceipt,
  FaTicketAlt,
  FaTachometerAlt,
  FaNewspaper,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange?: (tab: string) => void;
  isAuthenticated: boolean;
  authComponent: ReactNode;
  userRole?: "admin" | "support" | null;
}

export default function AdminLayout({
  children,
  currentTab,
  onTabChange,
  isAuthenticated,
  authComponent,
  userRole,
}: AdminLayoutProps) {
  const router = useRouter();

  const allTabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "products", label: "Products", icon: <FaBox /> },
    { id: "articles", label: "Articles", icon: <FaNewspaper /> },
    { id: "invoices", label: "Invoices", icon: <FaReceipt /> },
    { id: "coupons", label: "Coupons", icon: <FaTicketAlt /> },
    { id: "affiliates", label: "Affiliates", icon: <FaUsers /> },
  ];

  // Filter tabs based on user role
  // Support users: products, articles, invoices (no dashboard, coupons, affiliates)
  const tabs =
    userRole === "support"
      ? allTabs.filter(
          (tab) =>
            tab.id === "products" ||
            tab.id === "articles" ||
            tab.id === "invoices",
        )
      : allTabs;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/admin?tab=${tabId}`);
    }
  };

  const handleLogout = () => {
    document.cookie = "authenticated=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.reload();
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [currentTab]);

  if (!isAuthenticated) {
    return <>{authComponent}</>;
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(74,222,128,0.06),transparent_40%,rgba(148,163,184,0.10))]" />
      {/* Top Navbar in normal flow (scrolls away with page) */}
      <div className="relative z-[120]">
        <header className="py-2 flex items-center justify-center relative flex-col">
          <Navbar disableScrollState staticInContainer zIndexClass="z-[120]" />
        </header>
      </div>

      <div className="relative z-10 flex flex-1 pb-24 pt-4 md:pb-0 md:pt-6">
        {/* Desktop Sidebar Only - intentionally below modal overlays */}
        <aside className="fixed left-0 top-0 z-[6] hidden h-full w-64 overflow-hidden border-r border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] bg-[var(--background)] pt-[120px] md:block">
          <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
          <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.06]" />
          <div className="relative h-full overflow-y-auto flex flex-col">
            <div className="p-4 flex-1">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                Admin Panel
              </h2>
              <nav>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-3 transition-colors ${
                      currentTab === tab.id
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--foreground)] hover:bg-[var(--color-admin-hover)]"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            <div className="border-t border-[var(--border)] p-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <span className="text-lg"><FaSignOutAlt /></span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content - with left margin to account for sidebar on desktop */}
        <main className="w-full p-4 md:ml-64 md:p-8">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={
              currentTab === "dashboard"
                ? ""
                : "rounded-2xl border border-[var(--color-admin-card-border)] bg-[var(--color-admin-card)] p-3 md:p-5"
            }
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar - Primary mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-[90] border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] bg-[var(--background)] md:hidden">
        <nav className="flex justify-around items-center py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentTab === tab.id
                  ? "text-[var(--primary)]"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 text-red-500 hover:text-red-400"
          >
            <span className="text-2xl"><FaSignOutAlt /></span>
          </button>
        </nav>
      </div>
    </div>
  );
}
