import Link from "next/link";
import BrandHeader from "@/components/BrandHeader";
import { brand } from "@/lib/config/brand";
import { formatPrice } from "@/lib/format";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { MENU_ITEM_COLUMNS } from "@/lib/menu";
import type { MenuItem } from "@/lib/types";

// ─────────────────────────────────────────────────────────────
// HOMEPAGE CONTENT — safe to customize in Module 4.
// Edit the words below, or reorder the sections in SECTION_ORDER.
// ─────────────────────────────────────────────────────────────

const headline = "Hot food, ordered in three taps.";
const subcopy =
  "Browse the kitchen, build your order and pick it up — or have it delivered. No phone calls, no waiting on hold, no forgetting what you wanted last time.";

const howItWorks = [
  { title: "1. Pick your dishes", text: "Browse the menu and add what you fancy to the cart." },
  { title: "2. Pickup or delivery", text: "Choose at checkout. We'll add the delivery fee only if you need it." },
  { title: "3. Track it to the door", text: "Watch it go from confirmed to ready, and reorder your favourites in one tap." },
];

// How many dishes to show on the homepage.
const FEATURED_COUNT = 3;

// Reorder these to change the page layout (Module 4 layout edit).
const SECTION_ORDER = ["hero", "featured", "how-it-works", "cta"] as const;

// ─────────────────────────────────────────────────────────────

type SectionId = (typeof SECTION_ORDER)[number];

async function loadFeaturedDishes(): Promise<MenuItem[]> {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return []; // Modules 1–4: no backend yet, the section just hides.

  const { data } = await supabase
    .from("menu_items")
    .select(MENU_ITEM_COLUMNS)
    .eq("is_available", true)
    .order("price_cents", { ascending: false })
    .limit(FEATURED_COUNT);

  return (data ?? []) as MenuItem[];
}

export default async function HomePage() {
  const featured = await loadFeaturedDishes();

  const sections: Record<SectionId, React.ReactNode> = {
    hero: (
      <section key="hero" className="px-4 py-16 text-center">
        {brand.showWorkshopBadge && (
          <span className="mb-4 inline-block rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600">
            Built at the TimeTec AI Workshop
          </span>
        )}
        <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
          {headline}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">{subcopy}</p>
        <p className="mt-2 text-sm font-medium" style={{ color: brand.primaryColor }}>
          {brand.tagline}
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-md px-6 py-3 font-medium text-white"
          style={{ backgroundColor: brand.primaryColor }}
        >
          See the menu
        </Link>
      </section>
    ),
    featured:
      featured.length === 0 ? null : (
        <section key="featured" className="px-4 py-12">
          <h2 className="text-center text-2xl font-semibold">Today&apos;s picks</h2>
          <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
            {featured.map((dish) => (
              <Link
                key={dish.id}
                href="/menu"
                className="rounded-xl border border-gray-200 p-6 transition hover:border-gray-300"
              >
                <span aria-hidden className="text-4xl">
                  {dish.emoji}
                </span>
                <h3 className="mt-3 font-semibold break-words">{dish.name}</h3>
                {dish.description && (
                  <p className="mt-2 text-sm break-words text-gray-600">
                    {dish.description}
                  </p>
                )}
                <p className="mt-3 font-medium" style={{ color: brand.primaryColor }}>
                  {formatPrice(dish.price_cents)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ),
    "how-it-works": (
      <section key="how-it-works" className="px-4 py-12">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-6 sm:grid-cols-3">
          {howItWorks.map((step) => (
            <div key={step.title} className="rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    cta: (
      <section key="cta" className="px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold">Hungry?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <Link
            href="/menu"
            className="rounded-md px-5 py-2.5 font-medium text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Start an order
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
          >
            Create an account
          </Link>
        </div>
      </section>
    ),
  };

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main>{SECTION_ORDER.map((id) => sections[id])}</main>
      <footer className="border-t border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
        {brand.name} — {brand.tagline}
      </footer>
    </div>
  );
}
