"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import type { ValidFulfillmentStatus } from "@/services/admin-orders.service";

interface OrderItem {
  id: number;
  productId: number;
  variantId: number | null;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  meta: Record<string, unknown> | null;
}

interface OrderEvent {
  id: number;
  type: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface OrderSummary {
  id: number;
  orderNumber: string;
  email: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  totalCents: number;
  itemCount: number;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
  };
  items: OrderItem[];
}

interface Props {
  initialOrders: OrderSummary[];
  pagination: {
    page: number;
    limit: number;
    totalOrders: number;
    totalPages: number;
  };
}

const STATUS_FILTERS: Array<{ id: string; label: string }> = [
  { id: "all", label: "All Orders" },
  { id: "unfulfilled", label: "Unfulfilled" },
  { id: "packed", label: "Packed" },
  { id: "shipped", label: "Shipped" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export function AdminOrdersClient({ initialOrders, pagination }: Props) {
  const [ordersList, setOrdersList] = useState<OrderSummary[]>(initialOrders);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fulfillment form state in drawer
  const [newStatus, setNewStatus] = useState<ValidFulfillmentStatus>("unfulfilled");
  const [trackingInput, setTrackingInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Open order detail and fetch audit events
  const handleOpenOrder = async (ord: OrderSummary) => {
    setSelectedOrder(ord);
    setNewStatus((ord.fulfillmentStatus as ValidFulfillmentStatus) || "unfulfilled");
    setTrackingInput(ord.trackingNumber || "");
    setNoteInput("");
    setIsLoadingDetails(true);

    try {
      const res = await fetch(`/api/admin/orders/${ord.id}`);
      if (res.ok) {
        const json = await res.json();
        setEvents(json.data?.events || []);
      }
    } catch (err) {
      console.error("Failed to load order audit events:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleUpdateFulfillment = async () => {
    if (!selectedOrder) return;
    setIsUpdating(true);

    try {
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus: newStatus,
          trackingNumber: trackingInput,
          note: noteInput,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to update fulfillment status");
      }

      const json = await res.json();
      const updatedOrder = json.data?.order;
      const updatedEvents = json.data?.events || [];

      // Update in local state
      setOrdersList((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                fulfillmentStatus: updatedOrder.fulfillmentStatus,
                trackingNumber: updatedOrder.trackingNumber,
              }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev
          ? {
              ...prev,
              fulfillmentStatus: updatedOrder.fulfillmentStatus,
              trackingNumber: updatedOrder.trackingNumber,
            }
          : null
      );
      setEvents(updatedEvents);
      setNoteInput("");
      showToast(`Order ${selectedOrder.orderNumber} updated to "${newStatus}"!`);
    } catch (error: any) {
      showToast(error.message || "Failed to update fulfillment");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = ordersList.filter((ord) => {
    if (activeFilter !== "all" && ord.fulfillmentStatus !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = ord.orderNumber.toLowerCase().includes(q);
      const matchEmail = ord.email.toLowerCase().includes(q);
      const matchTrack = ord.trackingNumber?.toLowerCase().includes(q);
      const matchName = ord.shippingAddress?.name?.toLowerCase().includes(q);
      return matchNum || matchEmail || matchTrack || matchName;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Top Controls: Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                activeFilter === f.id
                  ? "bg-stone-900 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search order #, email, customer…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-center">Payment</th>
                <th className="px-5 py-3.5 text-center">Fulfillment</th>
                <th className="px-5 py-3.5 text-right">Total</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-stone-400">
                    No orders match your current filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-stone-50/80 transition">
                    <td className="px-5 py-4 font-mono font-bold text-stone-900">
                      {ord.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-medium text-stone-900">
                        {ord.shippingAddress?.name || "Customer"}
                      </div>
                      <div className="text-stone-400 text-[11px]">{ord.email}</div>
                    </td>
                    <td className="px-5 py-4 text-stone-500 whitespace-nowrap">
                      {new Date(ord.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.paymentStatus === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.paymentStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          ord.fulfillmentStatus === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : ord.fulfillmentStatus === "shipped"
                              ? "bg-blue-100 text-blue-800"
                              : ord.fulfillmentStatus === "packed"
                                ? "bg-purple-100 text-purple-800"
                                : ord.fulfillmentStatus === "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-stone-200 text-stone-800"
                        }`}
                      >
                        {ord.fulfillmentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-stone-900">
                      {formatMoney(ord.totalCents)}
                      <div className="text-[10px] font-normal text-stone-400">
                        {ord.itemCount} items
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(ord)}
                        className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs hover:border-stone-900 hover:bg-stone-50 transition cursor-pointer"
                      >
                        Manage →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fulfillment Drawer / Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-2xs animate-fade-in">
          <div className="h-full w-full max-w-xl bg-white shadow-2xl p-6 sm:p-8 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    Order Details
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">
                    {selectedOrder.orderNumber}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Placed {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
                >
                  ✕
                </button>
              </div>

              {/* Customer & Shipping Details */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-stone-50 p-4 text-xs">
                <div>
                  <p className="font-semibold text-stone-900">Customer</p>
                  <p className="text-stone-700 mt-0.5">{selectedOrder.shippingAddress?.name}</p>
                  <p className="text-stone-500">{selectedOrder.email}</p>
                </div>
                <div>
                  <p className="font-semibold text-stone-900">Shipping Address</p>
                  <p className="text-stone-700 mt-0.5">{selectedOrder.shippingAddress?.line1}</p>
                  {selectedOrder.shippingAddress?.line2 && (
                    <p className="text-stone-700">{selectedOrder.shippingAddress.line2}</p>
                  )}
                  <p className="text-stone-500">
                    {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.region}{" "}
                    {selectedOrder.shippingAddress?.postalCode}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Items in Crate ({selectedOrder.items?.length || 0})
                </h4>
                <div className="divide-y divide-stone-100 border-y border-stone-100 text-xs">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="py-2.5 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-stone-900">{item.name}</p>
                        <p className="text-[11px] text-stone-400 font-mono">SKU: {item.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-stone-900">
                          {formatMoney(item.totalCents)}
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Qty: {item.quantity} × {formatMoney(item.unitPriceCents)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fulfillment Actions Card */}
              <div className="rounded-xl border border-stone-200 bg-amber-50/40 p-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                  Update Fulfillment &amp; Logistics
                </h4>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Fulfillment Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as ValidFulfillmentStatus)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                  >
                    <option value="unfulfilled">Unfulfilled (Awaiting Warehouse Pack)</option>
                    <option value="packed">Packed (Ready for Carrier Pickup)</option>
                    <option value="shipped">Shipped (In Transit)</option>
                    <option value="delivered">Delivered</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Carrier Tracking Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1Z9999999999999999 (UPS / FedEx / DHL)"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Internal Dispatch Note (Recorded in Audit Log)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pallet 4 dispatched via regional freight courier"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleUpdateFulfillment}
                  disabled={isUpdating}
                  className="w-full rounded-lg bg-stone-900 py-2.5 text-xs font-semibold text-white hover:bg-stone-700 disabled:opacity-50 transition cursor-pointer"
                >
                  {isUpdating ? "Saving Update…" : "Save Fulfillment Status"}
                </button>
              </div>

              {/* Audit Trail Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600 mb-3">
                  Audit History &amp; Events
                </h4>
                {isLoadingDetails ? (
                  <p className="text-xs text-stone-400">Loading audit trail…</p>
                ) : events.length === 0 ? (
                  <p className="text-xs text-stone-400">No recorded audit events for this order.</p>
                ) : (
                  <div className="space-y-2 border-l-2 border-stone-200 pl-4 text-xs">
                    {events.map((evt) => (
                      <div key={evt.id} className="relative">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-stone-800 capitalize">
                            {evt.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] text-stone-400">
                            {new Date(evt.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {evt.fromStatus && evt.toStatus && (
                          <p className="text-[11px] text-stone-600 mt-0.5">
                            Transitioned from <span className="font-medium">{evt.fromStatus}</span>{" "}
                            → <span className="font-semibold">{evt.toStatus}</span>
                          </p>
                        )}
                        <p className="text-[10px] text-stone-400 mt-0.5">Actor: {evt.actor}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Close Drawer Button */}
            <div className="pt-6 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full rounded-lg border border-stone-300 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
