import { BookPartyClient } from "@/components/BookPartyClient";
import { BookPartyVipGate } from "@/components/BookPartyVipGate";
import { BOAT_SEATS_TOTAL } from "@/lib/book-party-pricing";
import { getBoatSeatsRemaining } from "@/lib/ghl";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function fetchInitialSeats(): Promise<number | null> {
  try {
    return await getBoatSeatsRemaining();
  } catch (e) {
    console.error("[book-party] Could not fetch boat seats:", e);
    return null;
  }
}

export default async function BookPartyVipPage() {
  const initialBoatSeats = await fetchInitialSeats();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        Upgrade to VIP
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Step 2 of 2. One VIP ticket: private boat party + AC Hotel afternoon.
        Checkout below when you&apos;re ready.
      </p>

      <div className="mt-8">
        <Suspense
          fallback={
            <p className="text-zinc-500 dark:text-zinc-400">Loading&hellip;</p>
          }
        >
          <BookPartyVipGate>
            <BookPartyClient
              initialBoatSeats={initialBoatSeats}
              boatSeatsTotal={BOAT_SEATS_TOTAL}
            />
          </BookPartyVipGate>
        </Suspense>
      </div>
    </div>
  );
}
