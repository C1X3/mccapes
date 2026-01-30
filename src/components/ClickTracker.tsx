"use client";

import { useEffect } from "react";

export function ClickTracker() {
  useEffect(() => {
    fetch("/api/site-click", { method: "POST" }).catch(() => {});
  }, []);

  return null;
}
