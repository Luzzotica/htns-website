import { BOAT_SEATS_TOTAL } from "@/lib/book-party-pricing";
import { getBoatSeatsRemaining } from "@/lib/ghl";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const remaining = await getBoatSeatsRemaining();
    return NextResponse.json({
      remaining,
      total: BOAT_SEATS_TOTAL,
    });
  } catch (e) {
    console.error("[book-party/seats]", e);
    return NextResponse.json(
      { error: "Could not fetch seat availability" },
      { status: 503 },
    );
  }
}
