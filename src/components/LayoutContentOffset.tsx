"use client";

import { usePathname } from "next/navigation";

export default function LayoutContentOffset({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <div className={isAdmin ? "" : "site-typography [&>*]:pt-28"}>
      {children}
    </div>
  );
}
