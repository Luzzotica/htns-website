import { BookPartyClient } from "@/components/BookPartyClient";
import { EarlyBirdCountdown } from "@/components/EarlyBirdCountdown";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import {
  BOAT_SEATS_TOTAL,
  getBookPartyPricingState,
} from "@/lib/book-party-pricing";
import { getBoatSeatsRemaining } from "@/lib/ghl";
import Image from "next/image";
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

export default async function HtnsBookPartyPage() {
  const [initialBoatSeats, pricing] = await Promise.all([
    fetchInitialSeats(),
    Promise.resolve(getBookPartyPricingState()),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          {/* ── Hero ── */}
          <div className="flex flex-col items-center text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              He blew up a chemical plant.
              <br />
              <span className="text-zinc-500 dark:text-zinc-400">
                With a laptop.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              During a U.S.&nbsp;Air Force exercise, Vince Romney hacked into a
              chemical facility and took it offline &mdash; not with a weapon,
              but with a keyboard. After 23&nbsp;years in military cyber ops, he
              knows exactly how attackers think.
            </p>

            <p className="mt-4 max-w-xl text-lg font-medium text-zinc-800 dark:text-zinc-200">
              Now he wrote the book on how to stop them. And he&apos;s throwing
              a party to prove you don&apos;t need a PhD to protect yourself.
            </p>

            <Image
              src="/cover.jpg"
              alt="How to Not Suck at Cybersecurity book cover"
              width={200}
              height={300}
              className="mt-10 rounded-lg shadow-lg"
              priority
            />

            <p className="mt-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
              How&nbsp;to&nbsp;Not&nbsp;Suck&#8482; Book Party
            </p>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
              April&nbsp;18 &middot; 5&nbsp;hours &middot; boat + hotel &middot;
              limited seats
            </p>
          </div>

          {/* ── About the author ── */}
          <section className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Image
              src="/VinceRomney.png"
              alt="Vince Romney"
              width={140}
              height={140}
              className="shrink-0 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                The guy you want in your corner
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Deputy CISO &amp; Enterprise Security Architect at Nu&nbsp;Skin.
                Founder of Digital Defense Security. CISSP, CCSP, CSSLP. Former
                President of the ISC2 Utah&nbsp;Chapter. The person
                Fortune&nbsp;500 companies call when things go wrong.
              </p>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Vince didn&apos;t write another boring cybersecurity textbook.
                He wrote the no&#8209;BS, actually&#8209;useful guide for real
                people who are tired of being easy targets. No jargon. No
                buzzword bingo. Just the stuff that matters.
              </p>
            </div>
          </section>

          {/* ── Schedule ── */}
          <section className="mt-14 rounded-xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Two parts. One unforgettable afternoon.
            </h2>
            <div className="mt-4 space-y-5 text-zinc-700 dark:text-zinc-300">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Part 1 &mdash; Private Boat Party
                </p>
                <p>
                  12:00&ndash;2:00 pm on the water. On&#8209;board lunch, book
                  signing, photos with Vince, and networking with entrepreneurs,
                  execs &amp; security pros. Only 96 seats.
                </p>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Part 2 &mdash; AC Hotel
                </p>
                <p>
                  2:30&ndash;4:30 pm. Live Q&amp;A, deeper conversation, and
                  more time with the author. Open to everyone.
                </p>
              </div>
            </div>
          </section>

          {/* ── Tickets / checkout ── */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Grab your ticket
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Choose the experience that works for you. The boat has limited
              seats &mdash; grab yours before they&apos;re gone.
            </p>
            {pricing.configured &&
              pricing.isEarlyBird &&
              pricing.earlyBirdEndsAtISO && (
                <div className="mt-6">
                  <Suspense>
                    <EarlyBirdCountdown
                      endsAtISO={pricing.earlyBirdEndsAtISO}
                    />
                  </Suspense>
                </div>
              )}

            <div className="mt-8">
              <Suspense
                fallback={
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Loading&hellip;
                  </p>
                }
              >
                <BookPartyClient
                  initialBoatSeats={initialBoatSeats}
                  boatSeatsTotal={BOAT_SEATS_TOTAL}
                  isEarlyBird={pricing.isEarlyBird}
                />
              </Suspense>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
