import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Clay & Co. — Tiles you can turn.",
  description:
    "Thick, glazed ceramic tiles and considered furniture. Explore tiles and furniture in real-time 3D, visualize them in your room, and view furniture in AR.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#faf7f0] text-stone-900 antialiased">
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
        {children}
        <Footer />
      </body>
    </html>
  );
}
