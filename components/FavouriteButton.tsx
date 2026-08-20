"use client";

import Link from "next/link";

/** The heart on a dish. Signed out, it's a link to sign in rather than a
 *  button that would fail — there's nowhere to save a favourite to. */
export default function FavouriteButton({
  isFavourite,
  dishName,
  onToggle,
}: {
  isFavourite: boolean;
  dishName: string;
  onToggle: (() => void) | null;
}) {
  if (!onToggle) {
    return (
      <Link
        href="/login?next=/menu"
        title="Sign in to save favourites"
        aria-label={`Sign in to save ${dishName} as a favourite`}
        className="text-xl leading-none text-gray-300 hover:text-gray-400"
      >
        ♡
      </Link>
    );
  }

  return (
    <button
      onClick={onToggle}
      aria-pressed={isFavourite}
      aria-label={
        isFavourite ? `Remove ${dishName} from favourites` : `Save ${dishName} as a favourite`
      }
      className={`text-xl leading-none ${
        isFavourite ? "text-red-500" : "text-gray-300 hover:text-red-400"
      }`}
    >
      {isFavourite ? "♥" : "♡"}
    </button>
  );
}
