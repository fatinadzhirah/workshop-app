import { redirect } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import FavouritesClient from "@/components/FavouritesClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MENU_ITEM_COLUMNS } from "@/lib/menu";
import { brand } from "@/lib/config/brand";
import type { MenuItem } from "@/lib/types";

export const metadata = { title: `Favourites — ${brand.name}` };

export default async function FavouritesPage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-2xl font-bold">Favourites</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // One round-trip: your favourite rows, each with the dish attached.
  // RLS keeps this to your own rows without an explicit filter.
  const { data } = await supabase
    .from("favourites")
    .select(`created_at, menu_items (${MENU_ITEM_COLUMNS})`)
    .order("created_at", { ascending: false });

  const items = ((data ?? []) as unknown as { menu_items: MenuItem | null }[])
    .map((row) => row.menu_items)
    .filter((item): item is MenuItem => item !== null);

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Favourites</h1>
        <p className="mt-1 text-gray-600">The dishes you keep coming back to.</p>
        <FavouritesClient userId={user.id} initialItems={items} />
      </main>
    </div>
  );
}
