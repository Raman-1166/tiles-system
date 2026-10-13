import { redirect } from "next/navigation";
import { isAdminSessionServer } from "@/lib/admin-session";
import { listProducts } from "@/db/queries";
import { AdminLogoutButton } from "./AdminLogoutButton";
import { TileImage } from "@/components/tiles/TileImage";
import { FurnitureImage } from "@/components/furniture/FurnitureImage";

export const metadata = { title: "Admin Dashboard — Clay & Co." };

export default async function AdminDashboard() {
  const ok = await isAdminSessionServer();
  if (!ok) redirect("/admin/login");

  let products: Awaited<ReturnType<typeof listProducts>> = [];
  let dbError = false;

  try {
    products = await listProducts({ isActive: undefined, limit: 200 });
  } catch {
    dbError = true;
  }

  return (
    <main className="min-h-screen bg-[#E4E8E3]">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#14262B]">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-stone-500">Clay &amp; Co. internal panel</p>
          </div>
          <AdminLogoutButton />
        </div>

        {dbError ? (
          <div className="rounded-2xl bg-[#F6F4EE] p-8 text-center">
            <p className="text-stone-500">Could not load products.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-[#F6F4EE] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <h2 className="font-semibold text-[#14262B]">
                Products <span className="ml-2 text-stone-400 font-normal text-sm">({products.length})</span>
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-100 text-left text-stone-600">
                    <th className="px-4 py-3 font-medium w-14">Preview</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium text-right">Stock</th>
                    <th className="px-4 py-3 font-medium text-center">Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((p) => {
                    const totalStock = p.productVariants.reduce(
                      (s, v) => s + v.stockQuantity,
                      0
                    );
                    const lowStock = totalStock > 0 && totalStock < 15;
                    const isTile = p.category?.type === "tile";

                    return (
                      <tr key={p.id} className="hover:bg-stone-50 transition">
                        <td className="px-4 py-2.5">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-stone-100 border border-stone-200 shrink-0">
                            {isTile ? (
                              <TileImage product={p} variant="closeup" size={40} className="h-full w-full object-cover" />
                            ) : (
                              <FurnitureImage product={p} size={40} className="h-full w-full object-cover" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#14262B]">{p.name}</td>
                        <td className="px-4 py-3 text-stone-500">{p.category?.name ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-stone-700">
                          {(p.priceCents / 100).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={lowStock ? "text-amber-600 font-medium" : totalStock === 0 ? "text-red-600 font-medium" : "text-stone-700"}>
                            {totalStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.isActive ? (
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                          ) : (
                            <span className="inline-block h-2 w-2 rounded-full bg-stone-300" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-6 text-xs text-stone-400 text-center">
          Full add/edit forms coming soon.
        </p>
      </div>
    </main>
  );
}
