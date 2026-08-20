import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import MenuClient from "@/components/MenuClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loadFavouriteIds, loadMenu } from "@/lib/menu";
import { brand } from "@/lib/config/brand";

export const metadata = { title: `Menu — ${brand.name}` };

export default async function MenuPage() {
  const supabase = await getSupabaseServerClient();

  // Modules 1–4: no backend yet — show the page shell, not a crash.
  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-2xl font-bold">Menu</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  // No redirect here: browsing the menu never requires an account.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ categories, items }, favouriteIds] = await Promise.all([
    loadMenu(supabase),
    user ? loadFavouriteIds(supabase) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-bold">Menu</h1>
        <p className="mt-1 text-gray-600">
          Pick what you want, then check out for pickup or delivery.
        </p>

        <div className="mt-6">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
              The menu is empty. Run{" "}
              <code>supabase/workshop-schema.sql</code> in the Supabase SQL editor to
              create the tables and seed the dishes.
            </p>
          ) : (
            <MenuClient
              categories={categories}
              items={items}
              userId={user?.id ?? null}
              initialFavouriteIds={favouriteIds}
            />
          )}
        </div>
      </main>
    </div>
  );
}
