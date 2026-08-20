import Link from "next/link";
import Image from "next/image";
import { brand } from "@/lib/config/brand";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import CartButton from "./CartButton";
import SignOutButton from "./SignOutButton";

/** Top navigation, shown on every page. Reads the session on the server so
 *  the right links are in the very first HTML — no signed-out flicker. */
export default async function BrandHeader() {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-lg font-semibold"
          style={{ color: brand.primaryColor }}
        >
          <Image src={brand.logo} alt={`${brand.name} logo`} width={28} height={28} />
          {brand.name}
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-3">
          <Link
            href="/menu"
            className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900 sm:px-3"
          >
            Menu
          </Link>

          {user ? (
            <>
              <Link
                href="/app"
                className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900 sm:px-3"
              >
                Orders
              </Link>
              <Link
                href="/app/favourites"
                className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900 sm:px-3"
              >
                Favourites
              </Link>
              <CartButton />
              <SignOutButton />
            </>
          ) : (
            <>
              <CartButton />
              <Link
                href="/login"
                className="rounded-md px-2 py-1.5 text-gray-600 hover:text-gray-900 sm:px-3"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="hidden rounded-md px-3 py-1.5 font-medium text-white sm:inline-block"
                style={{ backgroundColor: brand.primaryColor }}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
