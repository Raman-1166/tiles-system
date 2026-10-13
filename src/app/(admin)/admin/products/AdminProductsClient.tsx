"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { TileImage } from "@/components/tiles/TileImage";
import { FurnitureImage } from "@/components/furniture/FurnitureImage";

interface Variant {
  id: number;
  productId: number;
  sku: string;
  size: string | null;
  colour: string | null;
  finish: string | null;
  priceCents: number;
  salePriceCents: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
}

interface ProductWithVariants {
  id: number;
  name: string;
  slug: string;
  description: string;
  tagline: string | null;
  priceCents: number;
  categoryId: number;
  soldBy: string;
  unit: string | null;
  material: string | null;
  finish: string | null;
  isActive: boolean;
  category: { id: number; name: string; slug: string; type: string } | null;
  productVariants: Variant[];
  totalStock: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  type: string;
}

interface Props {
  initialProducts: ProductWithVariants[];
  categories: Category[];
}

export function AdminProductsClient({ initialProducts, categories }: Props) {
  const [productsList, setProductsList] = useState<ProductWithVariants[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Variant editing state: variantId -> { stockQuantity, priceCents }
  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);
  const [variantStockInput, setVariantStockInput] = useState<string>("");
  const [variantPriceInput, setVariantPriceInput] = useState<string>("");
  const [isSavingStock, setIsSavingStock] = useState(false);

  // Modal state
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newForm, setNewForm] = useState({
    name: "",
    slug: "",
    description: "",
    tagline: "",
    categoryId: categories[0]?.id || 1,
    priceCents: 4500,
    soldBy: "box" as "box" | "unit",
    material: "Artisanal Glazed Ceramic",
    initialStock: 30,
  });

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const startEditVariant = (variant: Variant) => {
    setEditingVariantId(variant.id);
    setVariantStockInput(String(variant.stockQuantity));
    setVariantPriceInput((variant.priceCents / 100).toFixed(2));
  };

  const handleSaveVariant = async (variantId: number, productId: number) => {
    setIsSavingStock(true);
    const stockQty = parseInt(variantStockInput, 10);
    const priceCents = Math.round(parseFloat(variantPriceInput) * 100);

    if (isNaN(stockQty) || isNaN(priceCents) || stockQty < 0 || priceCents <= 0) {
      showToast("Invalid stock quantity or price value");
      setIsSavingStock(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockQuantity: stockQty,
          priceCents,
        }),
      });

      if (!res.ok) throw new Error("Failed to update variant stock");

      const json = await res.json();
      const updatedVariant: Variant = json.data;

      // Update in local state
      setProductsList((prev) =>
        prev.map((p) => {
          if (p.id !== productId) return p;
          const nextVariants = p.productVariants.map((v) =>
            v.id === variantId ? { ...v, stockQuantity: stockQty, priceCents } : v
          );
          return {
            ...p,
            productVariants: nextVariants,
            totalStock: nextVariants.reduce((sum, v) => sum + v.stockQuantity, 0),
          };
        })
      );

      setEditingVariantId(null);
      showToast(`SKU ${updatedVariant.sku} stock updated to ${stockQty} units!`);
    } catch (err: any) {
      showToast(err.message || "Failed to update variant");
    } finally {
      setIsSavingStock(false);
    }
  };

  const handleToggleProductActive = async (p: ProductWithVariants) => {
    const nextActive = !p.isActive;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: nextActive }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      setProductsList((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, isActive: nextActive } : item))
      );
      showToast(`${p.name} is now ${nextActive ? "Active" : "Archived"}`);
    } catch (err: any) {
      showToast(err.message || "Failed to toggle status");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Image upload failed");
      }

      const json = await res.json();
      setUploadedImageUrl(json.data.url);
      showToast("Image uploaded successfully! 🖼️");
    } catch (err: any) {
      showToast(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newForm,
          categoryId: Number(newForm.categoryId),
          priceCents: Math.round(Number(newForm.priceCents)),
          initialStock: Number(newForm.initialStock),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Failed to create product");
      }

      const json = await res.json();
      const created: ProductWithVariants = json.data;

      setProductsList((prev) => [created, ...prev]);
      setIsNewProductOpen(false);
      showToast(`Product "${created.name}" created successfully!`);
    } catch (err: any) {
      showToast(err.message || "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = productsList.filter((p) => {
    if (selectedCategory !== "all" && String(p.categoryId) !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white shadow-xl animate-fade-in">
          {toastMessage}
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs font-semibold text-stone-800 focus:border-stone-900 focus:outline-none"
          >
            <option value="all">All Categories ({productsList.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search products by title or slug…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 rounded-xl border border-stone-200 bg-stone-50/50 px-3.5 py-2 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Add Product Button */}
        <button
          type="button"
          onClick={() => setIsNewProductOpen(true)}
          className="cursor-pointer inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white shadow-sm hover:bg-stone-700 transition"
        >
          <span>＋</span>
          <span>New Product</span>
        </button>
      </div>

      {/* Products & Variant Stock Table */}
      <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200/80 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 w-16">Preview</th>
                <th className="px-5 py-3.5">Product &amp; Category</th>
                <th className="px-5 py-3.5">Base Price</th>
                <th className="px-5 py-3.5">Total Stock</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Variants &amp; SKU Stock Quick-Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {filteredProducts.map((p) => {
                const isTile = p.category?.type === "tile";
                const isLowStock = p.totalStock > 0 && p.totalStock < 15;

                return (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    {/* Thumbnail */}
                    <td className="px-5 py-4 align-top">
                      <div className="h-12 w-12 overflow-hidden rounded-lg bg-stone-100 border border-stone-200 shrink-0">
                        {isTile ? (
                          <TileImage
                            product={p as any}
                            variant="closeup"
                            size={48}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <FurnitureImage
                            product={p as any}
                            size={48}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    </td>

                    {/* Details */}
                    <td className="px-5 py-4 align-top">
                      <p className="font-bold text-stone-900 text-sm">{p.name}</p>
                      <p className="text-[11px] text-stone-400 font-mono">/{p.slug}</p>
                      <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-100 text-stone-600">
                        {p.category?.name || "Uncategorized"}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="px-5 py-4 align-top font-semibold text-stone-900">
                      {formatMoney(p.priceCents)}
                      <span className="text-[11px] font-normal text-stone-400 block">
                        per {p.soldBy || "unit"}
                      </span>
                    </td>

                    {/* Total Stock */}
                    <td className="px-5 py-4 align-top">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          p.totalStock === 0
                            ? "bg-red-100 text-red-800"
                            : isLowStock
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {p.totalStock} units
                      </span>
                    </td>

                    {/* Active Toggle */}
                    <td className="px-5 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => handleToggleProductActive(p)}
                        className={`cursor-pointer px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition ${
                          p.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                            : "bg-stone-200 text-stone-600 hover:bg-emerald-100 hover:text-emerald-800"
                        }`}
                        title="Click to toggle active status"
                      >
                        {p.isActive ? "Active ✓" : "Archived ✕"}
                      </button>
                    </td>

                    {/* Variants and Quick Stock Editor */}
                    <td className="px-5 py-4 align-top">
                      <div className="space-y-2">
                        {p.productVariants.map((v) => {
                          const isEditing = editingVariantId === v.id;

                          return (
                            <div
                              key={v.id}
                              className="flex flex-wrap items-center gap-2 p-2 rounded-lg bg-stone-50 border border-stone-200/60"
                            >
                              <div className="flex-1 min-w-[120px]">
                                <span className="font-mono font-bold text-stone-900 text-[11px]">
                                  {v.sku}
                                </span>
                                <span className="text-[10px] text-stone-500 block">
                                  {v.size || v.finish || "Standard"}
                                </span>
                              </div>

                              {isEditing ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-stone-500">Qty:</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={variantStockInput}
                                      onChange={(e) => setVariantStockInput(e.target.value)}
                                      className="w-16 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-stone-500">$</span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={variantPriceInput}
                                      onChange={(e) => setVariantPriceInput(e.target.value)}
                                      className="w-18 rounded border border-stone-300 bg-white px-2 py-1 text-xs font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleSaveVariant(v.id, p.id)}
                                    disabled={isSavingStock}
                                    className="cursor-pointer rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingVariantId(null)}
                                    className="cursor-pointer rounded border border-stone-300 bg-white px-2 py-1 text-[11px] text-stone-600 hover:bg-stone-100"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-medium text-stone-800">
                                    {v.stockQuantity} in stock
                                  </span>
                                  <span className="text-xs font-semibold text-stone-900">
                                    {formatMoney(v.priceCents)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => startEditVariant(v)}
                                    className="cursor-pointer text-[11px] font-semibold text-amber-800 hover:underline"
                                  >
                                    Edit Stock →
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Product Modal */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  Catalog Expansion
                </span>
                <h3 className="text-xl font-bold font-serif text-stone-900 mt-1">
                  Create New Artisanal Product
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewProductOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Seville Moroccan Zellige Tile"
                    value={newForm.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "");
                      setNewForm({ ...newForm, name, slug });
                    }}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="seville-moroccan-zellige"
                    value={newForm.slug}
                    onChange={(e) => setNewForm({ ...newForm, slug: e.target.value })}
                    className="w-full rounded-lg border border-stone-300 p-2 font-mono text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Hand-molded earthenware with iridescent glazed finish"
                  value={newForm.tagline}
                  onChange={(e) => setNewForm({ ...newForm, tagline: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Full architectural product narrative, material composition and applications…"
                  value={newForm.description}
                  onChange={(e) => setNewForm({ ...newForm, description: e.target.value })}
                  className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Category</label>
                  <select
                    value={newForm.categoryId}
                    onChange={(e) => setNewForm({ ...newForm, categoryId: Number(e.target.value) })}
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={(newForm.priceCents / 100).toFixed(2)}
                    onChange={(e) =>
                      setNewForm({
                        ...newForm,
                        priceCents: Math.round(parseFloat(e.target.value || "0") * 100),
                      })
                    }
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Initial Stock (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newForm.initialStock}
                    onChange={(e) =>
                      setNewForm({ ...newForm, initialStock: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full rounded-lg border border-stone-300 p-2 text-stone-900 focus:outline-none focus:border-stone-900"
                  />
                </div>
              </div>

              {/* Image Upload in Modal */}
              <div className="rounded-xl border border-dashed border-stone-300 p-4 bg-stone-50/50">
                <label className="block font-medium text-stone-700 mb-1">
                  Upload Product Photography (JPEG, PNG, WebP)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="w-full text-stone-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-700 cursor-pointer"
                />
                {uploadedImageUrl && (
                  <p className="mt-2 text-[11px] text-emerald-700 font-medium">
                    Uploaded: {uploadedImageUrl}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsNewProductOpen(false)}
                  className="cursor-pointer rounded-lg border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating…" : "Publish Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
