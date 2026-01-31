"use client";

import DashboardTab from "@/components/admin/DashboardTab";
import ProductsTab from "@/components/admin/ProductsTab";
import ArticlesTab from "@/components/admin/ArticlesTab";
import InvoicesTab from "@/components/admin/InvoicesTab";
import CouponsTab from "@/components/admin/CouponsTab";
import AffiliatesTab from "@/components/admin/AffiliatesTab";
import AdminWrapper from "@/components/AdminWrapper";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTRPC } from "@/server/client";
import { useQuery } from "@tanstack/react-query";

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const trpc = useTRPC();

  // Get auth status including role
  const { data: authData } = useQuery(trpc.auth.isAuthenticated.queryOptions());
  const userRole = authData?.role as "admin" | "support" | null | undefined;

  // Initialize with tab from URL or default to dashboard
  const [currentTab, setCurrentTab] = useState(tabParam || "dashboard");

  // Redirect support users to products if they try to access restricted tabs or no tab specified
  useEffect(() => {
    if (userRole === "support") {
      const restrictedTabs = ["dashboard", "coupons", "affiliates"];
      if (!tabParam || restrictedTabs.includes(currentTab)) {
        setCurrentTab("products");
        router.replace("/admin?tab=products");
      }
    }
  }, [userRole, tabParam, currentTab, router]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    router.push(`/admin?tab=${tab}`);
  };

  // Update state if URL changes
  useEffect(() => {
    if (tabParam && tabParam !== currentTab) {
      setCurrentTab(tabParam);
    }
  }, [tabParam, currentTab]);

  const renderTabContent = () => {
    switch (currentTab) {
      case "dashboard":
        return <DashboardTab />;
      case "products":
        return <ProductsTab />;
      case "articles":
        return <ArticlesTab />;
      case "invoices":
        return <InvoicesTab />;
      case "coupons":
        return <CouponsTab />;
      case "affiliates":
        return <AffiliatesTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <AdminWrapper setCurrentTab={handleTabChange} currentTab={currentTab}>
      {renderTabContent()}
    </AdminWrapper>
  );
}
