import { NextRequest, NextResponse } from "next/server";
import { listProducts, listCategories } from "@/lib/products";

export async function GET(request: NextRequest) {
  const categorySlug = request.nextUrl.searchParams.get("category");

  // If category slug provided, find the category ID first
  let categoryId: number | undefined;
  if (categorySlug) {
    const allCategories = await listCategories();
    const matchedCategory = allCategories.find((c) => c.slug === categorySlug);
    categoryId = matchedCategory?.id;
  }

  const items = await listProducts({ categoryId });
  return NextResponse.json({ products: items });
}
