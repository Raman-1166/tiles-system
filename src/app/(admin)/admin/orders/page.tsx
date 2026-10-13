import { redirect } from "next/navigation";
import { isAdminSessionServer } from "@/lib/admin-session";
import { AdminOrderService } from "@/services/admin-orders.service";
import { AdminOrdersClient } from "./AdminOrdersClient";

export const metadata = {
  title: "Order Fulfillment Dashboard — Clay & Co. Admin",
};

export default async function AdminOrdersPage() {
  const ok = await isAdminSessionServer();
  if (!ok) redirect("/admin/login");

  let ordersData: Awaited<ReturnType<typeof AdminOrderService.listOrders>> = {
    orders: [],
    pagination: { page: 1, limit: 50, totalOrders: 0, totalPages: 1 },
  };

  try {
    ordersData = await AdminOrderService.listOrders({ limit: 50 });
  } catch (err) {
    console.error("Failed to load admin orders:", err);
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100/60 px-2.5 py-0.5 rounded-full">
          Warehouse &amp; Logistics
        </span>
        <h1 className="mt-2 text-3xl font-bold font-serif text-stone-900 tracking-tight">
          Order Fulfillment Dashboard
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Manage pending crate shipments, track carrier dispatches, and review immutable audit
          histories.
        </p>
      </div>

      <AdminOrdersClient
        initialOrders={ordersData.orders as any}
        pagination={ordersData.pagination}
      />
    </div>
  );
}
