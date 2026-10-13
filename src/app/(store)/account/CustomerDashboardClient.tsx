"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { useCartStore } from "@/store/cartStore";

interface Order {
  id: number;
  orderNumber: string;
  totalCents: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  createdAt: string;
}

interface Address {
  id: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
}

interface SavedCartItem {
  id: string;
  productId: number;
  variantId?: number;
  name: string;
  priceCents: number;
  quantity: number;
  image?: string;
}

interface Props {
  initialCustomer: Customer;
  initialAddresses: Address[];
  initialOrders: Order[];
}

export function CustomerDashboardClient({
  initialCustomer,
  initialAddresses,
  initialOrders,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "saved">("orders");
  const [addressesList, setAddressesList] = useState<Address[]>(initialAddresses);
  const [ordersList, setOrdersList] = useState<Order[]>(initialOrders);
  const [savedItems, setSavedItems] = useState<SavedCartItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Address form
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [addressSubmitting, setAddressSubmitting] = useState(false);
  const [newAddress, setNewAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "US",
    isDefault: false,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load wishlist / saved for later from localStorage ("clay_saved_cart_items")
  useEffect(() => {
    try {
      const raw = localStorage.getItem("clay_saved_cart_items");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedItems(parsed);
        }
      }
    } catch (err) {
      console.warn("Could not load saved cart items from localStorage:", err);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/account/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressSubmitting(true);

    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAddress),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to save address");
      }

      const json = await res.json();
      const created: Address = json.data;

      setAddressesList((prev) => [created, ...prev]);
      setIsAddingAddress(false);
      setNewAddress({
        line1: "",
        line2: "",
        city: "",
        region: "",
        postalCode: "",
        country: "US",
        isDefault: false,
      });
      showToast("Shipping address added to your account! 📍");
    } catch (err: any) {
      showToast(err.message || "Failed to save address");
    } finally {
      setAddressSubmitting(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const res = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to remove address");

      setAddressesList((prev) => prev.filter((a) => a.id !== id));
      showToast("Address removed");
    } catch (err: any) {
      showToast(err.message || "Failed to remove address");
    }
  };

  const handleMoveToBag = async (item: SavedCartItem) => {
    const { showToast: toast, openMiniCart } = useCartStore.getState();

    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity || 1,
        }),
      });

      if (!res.ok) throw new Error("Could not add to bag");

      const json = await res.json();
      useCartStore.getState().setFromResponse(json);

      // Remove from savedItems
      const updated = savedItems.filter((s) => s.id !== item.id);
      setSavedItems(updated);
      localStorage.setItem("clay_saved_cart_items", JSON.stringify(updated));

      toast(`Moved "${item.name}" to your shopping bag!`, "success");
      openMiniCart();
    } catch (err: any) {
      showToast(err.message || "Failed to move item to bag");
    }
  };

  return (
    <div className="space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Account Overview Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xs">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            Client Profile
          </span>
          <h2 className="mt-1 text-2xl font-bold font-serif text-stone-900">
            {initialCustomer.name}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {initialCustomer.email} • Client since{" "}
            {new Date(initialCustomer.createdAt).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="cursor-pointer rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-700 shadow-2xs hover:border-stone-900 hover:bg-stone-50 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "orders"
              ? "border-b-2 border-stone-900 text-stone-900 font-bold"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          Orders &amp; Shipments ({ordersList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "addresses"
              ? "border-b-2 border-stone-900 text-stone-900 font-bold"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          Saved Addresses ({addressesList.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("saved")}
          className={`pb-3 px-4 text-xs font-semibold uppercase tracking-wider transition ${
            activeTab === "saved"
              ? "border-b-2 border-stone-900 text-stone-900 font-bold"
              : "text-stone-400 hover:text-stone-700"
          }`}
        >
          Saved For Later ({savedItems.length})
        </button>
      </div>

      {/* Tab: Orders */}
      {activeTab === "orders" && (
        <div className="rounded-2xl border border-stone-200/80 bg-white overflow-hidden shadow-2xs">
          {ordersList.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-stone-500 font-medium">
                No orders found on your account yet.
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Explore our catalog to order sample swatches or complete crate projects.
              </p>
              <Link
                href="/shop"
                className="inline-block mt-4 rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-700 transition"
              >
                Browse Catalog →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Order Number</th>
                    <th className="px-5 py-3.5">Date</th>
                    <th className="px-5 py-3.5">Payment</th>
                    <th className="px-5 py-3.5">Fulfillment</th>
                    <th className="px-5 py-3.5">Tracking</th>
                    <th className="px-5 py-3.5 text-right">Total</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {ordersList.map((ord) => (
                    <tr key={ord.id} className="hover:bg-stone-50/60 transition">
                      <td className="px-5 py-4 font-mono font-bold text-stone-900">
                        {ord.orderNumber}
                      </td>
                      <td className="px-5 py-4 text-stone-500">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.paymentStatus === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ord.fulfillmentStatus === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : ord.fulfillmentStatus === "shipped"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-stone-200 text-stone-800"
                          }`}
                        >
                          {ord.fulfillmentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-stone-600">
                        {ord.trackingNumber || "—"}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-stone-900">
                        {formatMoney(ord.totalCents)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/order/${ord.orderNumber}`}
                          className="text-xs font-semibold text-[#0F6B6B] hover:underline"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Saved Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold font-serif text-stone-900">Delivery Addresses</h3>
            <button
              type="button"
              onClick={() => setIsAddingAddress(!isAddingAddress)}
              className="cursor-pointer rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-700 transition"
            >
              {isAddingAddress ? "Cancel" : "＋ Add New Address"}
            </button>
          </div>

          {/* Add Address Form */}
          {isAddingAddress && (
            <form
              onSubmit={handleAddAddress}
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm space-y-4 text-xs"
            >
              <h4 className="font-bold text-stone-900 text-sm">New Delivery Address</h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-medium text-stone-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Architectural Blvd"
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-stone-700 mb-1">
                    Apartment, suite, unit (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Suite 400"
                    value={newAddress.line2}
                    onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Austin"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">State / Region</label>
                  <input
                    type="text"
                    required
                    placeholder="TX"
                    value={newAddress.region}
                    onChange={(e) => setNewAddress({ ...newAddress, region: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="78701"
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <label htmlFor="isDefault" className="text-xs text-stone-700">
                  Set as my default shipping address
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSubmitting}
                  className="cursor-pointer rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  {addressSubmitting ? "Saving…" : "Save Address"}
                </button>
              </div>
            </form>
          )}

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addressesList.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 col-span-2">
                No delivery addresses saved yet. Click above to add your primary site address.
              </p>
            ) : (
              addressesList.map((addr) => (
                <div
                  key={addr.id}
                  className={`rounded-2xl border p-5 shadow-2xs relative ${
                    addr.isDefault
                      ? "border-amber-400/80 bg-amber-50/20"
                      : "border-stone-200/80 bg-white"
                  }`}
                >
                  {addr.isDefault && (
                    <span className="absolute top-4 right-4 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Default
                    </span>
                  )}
                  <p className="font-semibold text-stone-900 text-sm">{addr.line1}</p>
                  {addr.line2 && <p className="text-xs text-stone-700">{addr.line2}</p>}
                  <p className="text-xs text-stone-500 mt-1">
                    {addr.city}, {addr.region} {addr.postalCode}
                  </p>
                  <p className="text-xs text-stone-400">{addr.country}</p>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="cursor-pointer text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Saved For Later / Wishlist */}
      {activeTab === "saved" && (
        <div className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xs">
          <h3 className="text-base font-bold font-serif text-stone-900 mb-4">
            Saved For Later (Browser Wishlist)
          </h3>

          {savedItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Your saved list is empty. You can save items from your bag to review them later.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {savedItems.map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-stone-900">{item.name}</p>
                    <p className="text-stone-500">
                      Qty: {item.quantity} • {formatMoney(item.priceCents)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMoveToBag(item)}
                    className="cursor-pointer rounded-full bg-stone-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-stone-700 transition"
                  >
                    Move to Bag →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
