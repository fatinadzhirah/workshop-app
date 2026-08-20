import { redirect } from "next/navigation";
import BrandHeader from "@/components/BrandHeader";
import BackendNotConnected from "@/components/BackendNotConnected";
import CheckoutClient from "@/components/CheckoutClient";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { loadSettings } from "@/lib/menu";
import { brand } from "@/lib/config/brand";

export const metadata = { title: `Checkout — ${brand.name}` };

export default async function CheckoutPage() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <BrandHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <div className="mt-4">
            <BackendNotConnected />
          </div>
        </main>
      </div>
    );
  }

  // Identity is verified ON THE SERVER. Signed-out visitors are sent to sign in
  // and bounced straight back here afterwards — the cart is in their browser,
  // so nothing is lost on the way.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/checkout");

  const settings = await loadSettings(supabase);

  return (
    <div className="min-h-screen bg-white">
      <BrandHeader />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <CheckoutClient settings={settings} />
      </main>
    </div>
  );
}
