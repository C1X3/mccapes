import { ReactNode, useState } from "react";
import { motion } from "framer-motion";
import { FaBox, FaReceipt, FaTicketAlt, FaTachometerAlt, FaBars, FaTimes } from "react-icons/fa";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";

interface TabItem {
  id: string;
  label: string;
  icon: ReactNode;
}

interface AdminLayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const tabs: TabItem[] = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "products", label: "Products", icon: <FaBox /> },
    { id: "invoices", label: "Invoices", icon: <FaReceipt /> },
    { id: "coupons", label: "Coupons", icon: <FaTicketAlt /> },
  ];

  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
    // Close sidebar on mobile when a tab is selected
    setIsMobileSidebarOpen(false);
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

      {/* Mobile Menu Toggle Button */}
      <div className="fixed top-[120px] left-4 z-30 md:hidden">
        <button 
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="bg-[var(--primary)] text-white p-3 rounded-full shadow-lg"
        >
          {isMobileSidebarOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      <div className="flex flex-1 pt-[120px]">
        {/* Sidebar - Fixed to left edge of screen */}
        <aside 
          className={`${
            isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 fixed left-0 top-0 h-full w-64 bg-[var(--background)] border-r border-[color-mix(in_srgb,var(--foreground),var(--background)_85%)] z-20 transition-transform duration-300 ease-in-out md:pt-[120px]`}
        >
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

        {/* Overlay for mobile when sidebar is open */}
        {isMobileSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content - with left margin to account for sidebar */}
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

      {/* Footer */}
      <div className="md:ml-64">
        <Footer />
      </div>
    </div>
  );
} 