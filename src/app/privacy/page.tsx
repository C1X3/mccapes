"use client";

import { useEffect } from "react";

export default function PrivacyPage() {
  useEffect(() => {
    // Redirect to the PDF file, which will open in the browser's PDF viewer
    window.location.href = "/privacy-policy.pdf";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Redirecting to Privacy Policy...
        </h1>
        <p className="text-gray-600">
          If you are not automatically redirected,
          <a
            href="/privacy-policy.pdf"
            className="text-blue-600 hover:underline ml-1"
          >
            click here to view the Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
