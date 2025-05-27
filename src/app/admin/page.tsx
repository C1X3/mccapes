"use client";

import DashboardTab from "@/components/admin/DashboardTab";
import ProductsTab from "@/components/admin/ProductsTab";
import ArticlesTab from "@/components/admin/ArticlesTab";
import InvoicesTab from "@/components/admin/InvoicesTab";
import CouponsTab from "@/components/admin/CouponsTab";
import AdminWrapper from "@/components/AdminWrapper";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function AdminPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tabParam = searchParams.get("tab");

    // Initialize with tab from URL or default to dashboard
    const [currentTab, setCurrentTab] = useState(tabParam || "dashboard");

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
