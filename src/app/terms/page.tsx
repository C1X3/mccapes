"use client";

import { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    // Redirect to the PDF file, which will open in the browser's PDF viewer
    window.location.href = "/terms-of-service.pdf";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">
          Redirecting to Terms of Service...
        </h1>
        <p className="text-gray-600">
          If you are not automatically redirected,
          <a
            href="/terms-of-service.pdf"
            className="text-blue-600 hover:underline ml-1"
          >
            click here to view the Terms of Service
          </a>
        </p>
      </div>
    </div>
  );
}
