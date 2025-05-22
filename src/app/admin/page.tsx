"use client";

import DashboardTab from "@/components/admin/DashboardTab";
import ProductsTab from "@/components/admin/ProductsTab";
import InvoicesTab from "@/components/admin/InvoicesTab";
import CouponsTab from "@/components/admin/CouponsTab";
import AdminWrapper from "@/components/AdminWrapper";
import { useState } from "react";

export default function AdminDashboard() {
    const [currentTab, setCurrentTab] = useState("dashboard");

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
        <AdminWrapper setCurrentTab={setCurrentTab} currentTab={currentTab}>
            {renderTabContent()}
        </AdminWrapper>
    );
}
