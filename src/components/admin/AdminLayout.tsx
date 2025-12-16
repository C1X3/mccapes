import { ReactNode } from "react";
import { motion } from "framer-motion";
import { FaBox, FaReceipt, FaTicketAlt, FaTachometerAlt, FaNewspaper, FaUsers } from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import { useRouter } from "next/navigation";

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
}

export default function AdminLayout({
  children,
  currentTab,
  onTabChange,
  isAuthenticated,
  authComponent,
}: AdminLayoutProps) {
  const router = useRouter();

  const tabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "products", label: "Products", icon: <FaBox /> },
    { id: "articles", label: "Articles", icon: <FaNewspaper /> },
    { id: "invoices", label: "Invoices", icon: <FaReceipt /> },
    { id: "coupons", label: "Coupons", icon: <FaTicketAlt /> },
    { id: "affiliates", label: "Affiliates", icon: <FaUsers /> },
  ];

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      router.push(`/admin?tab=${tabId}`);
    }
  };

  if (!isAuthenticated) {
    return <>{authComponent}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Fixed Navbar */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-[var(--background)]">
        <header className="py-2 flex items-center justify-center relative flex-col">
          <Navbar />
        </header>
      </div>

      <div className="flex flex-1 pt-[120px] pb-20 md:pb-0">
        {/* Desktop Sidebar Only */}
        <aside className="hidden md:block fixed left-0 top-0 h-full w-64 bg-[var(--background)] border-r border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] z-20 pt-[120px]">
          <div className="h-full overflow-y-auto">
            <div className="p-4">
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">Admin Panel</h2>
              <nav>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left mb-3 transition-colors ${
                      currentTab === tab.id
                        ? "bg-[var(--primary)] text-white"
                        : "text-[var(--foreground)] hover:bg-[color-mix(in_srgb,var(--background),#333_10%)]"
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        {/* Main Content - with left margin to account for sidebar on desktop */}
        <main className="w-full md:ml-64 p-4 md:p-8">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar - Primary mobile navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--background)] border-t border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] md:hidden z-30">
        <nav className="flex justify-around items-center py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0 flex-1 ${
                currentTab === tab.id
                  ? "text-[var(--primary)]"
                  : "text-[color-mix(in_srgb,var(--foreground),#888_40%)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">
                {tab.id === "dashboard" ? "Dash" : tab.label}
              </span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
