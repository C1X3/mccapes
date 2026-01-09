"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import FAQSection from "@/components/FAQSection";

const FAQPage = () => {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="py-8 flex items-center justify-center relative flex-col">
        <Navbar />
      </header>

      <main className="container mx-auto px-6 py-16 max-w-5xl">
        <FAQSection showTitle={true} showContactButtons={true} />
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;

