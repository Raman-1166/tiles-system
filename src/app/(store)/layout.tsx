import type { ReactNode } from "react";
import { Suspense } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MiniCart } from "@/components/layout/MiniCart";
import { ToastContainer } from "@/components/ui/Toast";

export default function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <Navbar />
      </Suspense>
      {children}
      <Footer />
      <MiniCart />
      <ToastContainer />
    </>
  );
}
