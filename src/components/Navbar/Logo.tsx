"use client";

import { useRouter } from "next/navigation";

const Logo = () => {
  const router = useRouter();

  return (
    <div
      className="flex items-center cursor-pointer"
      onClick={() => router.push("/")}
    >
      <h1 className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">
        <span className="text-[var(--primary)]">MC</span>
        <span className="gradient-text">Capes</span>
      </h1>
    </div>
  );
};

export default Logo;
