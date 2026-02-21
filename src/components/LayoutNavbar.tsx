"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";

/**
 * Renders the Navbar at the root layout level so it stays above all page content.
 * Hidden on /admin where AdminLayout provides its own navbar.
 */
export default function LayoutNavbar() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <Navbar />;
}
