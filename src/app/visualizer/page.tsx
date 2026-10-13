import { listProducts } from "@/db/queries";
import { VisualizerClient } from "./VisualizerClient";

export const metadata = {
  title: "Room Visualizer — Clay & Co.",
  description:
    "See how our tiles look in your room. Adjust room type, surface, layout and grout colour in real time.",
};

type SearchParams = Promise<{ tile?: string; room?: string }>;

export default async function VisualizerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tile: tileSlug, room: initialRoom } = await searchParams;

  let tiles: Awaited<ReturnType<typeof listProducts>> = [];
  let dbError = false;

  try {
    const all = await listProducts({ type: "tile", isActive: true, limit: 100 });
    tiles = all.filter(
      (p) =>
        p.category &&
        !p.category.slug.includes("accessories") &&
        (p.category.slug.includes("tile") || p.category.slug.includes("mosaic"))
    );
  } catch {
    dbError = true;
  }

  // Resolve initial index from ?tile=slug
  const initialIdx = tileSlug
    ? Math.max(0, tiles.findIndex((t) => t.slug === tileSlug))
    : 0;

  return (
    <main className="min-h-screen bg-[#E4E8E3]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-[#14262B]">Room Visualizer</h1>
          <p className="mt-2 text-[#14262B]/70">
            See how our glazed tiles look on any surface before you buy.
          </p>
        </div>

        {dbError ? (
          <div className="rounded-2xl bg-[#F6F4EE] p-12 text-center shadow-sm">
            <p className="text-stone-500 text-lg">
              Could not load tile catalogue. Please try again later.
            </p>
          </div>
        ) : (
          <VisualizerClient tiles={tiles} initialTileIdx={initialIdx} initialRoom={initialRoom} />
        )}
      </div>
    </main>
  );
}
