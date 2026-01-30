"use client";

import { ReactNode, Suspense } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayoutSuspense({ children }: AdminLayoutProps) {
  return <Suspense>{children}</Suspense>;
}
