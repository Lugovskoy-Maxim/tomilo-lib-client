"use client";

import { Header, Footer } from "@/widgets";
import TopTitlesSection from "@/widgets/top-titles-section/TopTitlesSection";

export default function TopPageClient() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] py-4 sm:py-6 flex flex-col items-center">
        <TopTitlesSection standalone />
      </main>
      <Footer />
    </>
  );
}
