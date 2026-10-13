import { redirect } from "next/navigation";
import { isAdminSessionServer } from "@/lib/admin-session";
import { AdminProductService } from "@/services/admin-products.service";
import { AdminProductsClient } from "./AdminProductsClient";

export const metadata = {
  title: "Products & Stock Management — Clay & Co. Admin",
};

export default async function AdminProductsPage() {
  const ok = await isAdminSessionServer();
  if (!ok) redirect("/admin/login");

  let productsData: Awaited<ReturnType<typeof AdminProductService.listProducts>> = {
    products: [],
    categories: [],
    pagination: { page: 1, limit: 100, total: 0 },
  };

  try {
    productsData = await AdminProductService.listProducts({ limit: 100 });
  } catch (err) {
    console.error("Failed to load admin products:", err);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
          Inventory Control
        </span>
        <h1 className="mt-2 text-3xl font-bold font-serif text-stone-900 tracking-tight">
          Products &amp; SKU Stock Management
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Inline stock adjustments, real-time pricing updates, and catalog creation for bespoke
          collections.
        </p>
      </div>

      <AdminProductsClient
        initialProducts={productsData.products as any}
        categories={productsData.categories as any}
      />
    </div>
  );
}
