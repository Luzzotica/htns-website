import { BookPartyClient } from "@/components/BookPartyClient";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getBookPartyPricingState } from "@/lib/book-party-pricing";
import Image from "next/image";
import { Suspense } from "react";

/** Pricing depends on wall clock; avoid baking early-bird state at build time. */
export const dynamic = "force-dynamic";

const WHAT_YOU_GET = [
  {
    emoji: "📖",
    label: "Signed copy of the book",
    detail: "Handed to you by Vince himself",
  },
  {
    emoji: "📸",
    label: "Photo with the author",
    detail: "For the 'gram or the LinkedIn flex",
  },
  {
    emoji: "🚢",
    label: "Private boat cruise",
    detail: "2-hour cruise, 12:00–2:00 pm",
  },
  {
    emoji: "🏨",
    label: "AC Hotel after-party",
    detail: "Networking & Q&A, 2:30–4:30 pm",
  },
  {
    emoji: "🤝",
    label: "Networking with like-minded people",
    detail: "Entrepreneurs, execs & security pros",
  },
  {
    emoji: "🎤",
    label: "Live Q&A with Vince",
    detail: "Ask anything — cybersecurity or otherwise",
  },
];

export default function HtnsBookPartyPage() {
  const pricing = getBookPartyPricingState();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-3xl">
          {/* ── Hero ── */}
          <div className="flex flex-col items-center text-center">
            <Image
              src="/cover.jpg"
              alt="How to Not Suck at Cybersecurity book cover"
              width={200}
              height={300}
              className="rounded-lg shadow-lg"
              priority
            />
            <h1 className="mt-8 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              The Book Launch Party
            </h1>
            <p className="mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              During a U.S. Air Force exercise, Vince Romney &ldquo;blew
              up&rdquo; a chemical plant — not with a plane, but with a
              laptop. Now he wrote the book on making sure it doesn&apos;t
              happen to you.
            </p>
            <p className="mt-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">
              Come celebrate the launch of{" "}
              <span className="italic">
                How&nbsp;to&nbsp;Not&nbsp;Suck&nbsp;at&nbsp;Cybersecurity
              </span>
              . April&nbsp;18. Boat, hotel, signed book, and an afternoon
              you won&apos;t forget.
            </p>
          </div>

          {/* ── About the author ── */}
          <section className="mt-14 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            <Image
              src="/VinceRomney.png"
              alt="Vince Romney"
              width={140}
              height={140}
              className="shrink-0 rounded-full object-cover"
            />
            <div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                Meet Vince Romney
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                23-year U.S.&nbsp;Air Force veteran. Deputy CISO &amp;
                Enterprise Security Architect at Nu&nbsp;Skin. Founder of
                Digital Defense Security. CISSP, CCSP, CSSLP. Former
                President of the ISC2 Utah&nbsp;Chapter.
              </p>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                Vince wrote this book because nobody else did — a
                no-nonsense, actually-useful guide for real people who want
                to stop being an easy target. No jargon. No buzzword bingo.
                Just the stuff that matters.
              </p>
            </div>
          </section>

          {/* ── What you get ── */}
          <section className="mt-14">
            <h2 className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              What&apos;s included with your ticket
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {WHAT_YOU_GET.map(({ emoji, label, detail }) => (
                <li
                  key={label}
                  className="rounded-lg border border-zinc-200 px-5 py-4 dark:border-zinc-800"
                >
                  <span className="text-2xl">{emoji}</span>
                  <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">
                    {label}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {detail}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* ── Schedule ── */}
          <section className="mt-14 rounded-xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              April 18 — the day
            </h2>
            <div className="mt-4 space-y-4 text-zinc-700 dark:text-zinc-300">
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  Private Boat Cruise
                </p>
                <p>11:30 am arrival · 12:00–2:00 pm on the water</p>
              </div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  AC Hotel After-Party
                </p>
                <p>2:30–4:30 pm · networking, Q&amp;A, signed books</p>
              </div>
            </div>
          </section>

          {/* ── Tickets / checkout ── */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Grab your ticket
            </h2>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              One ticket covers everything — boat cruise, hotel after-party,
              signed book, and all the networking you can handle.
            </p>
            <div className="mt-8">
              <Suspense
                fallback={
                  <p className="text-zinc-500 dark:text-zinc-400">
                    Loading…
                  </p>
                }
              >
                <BookPartyClient
                  earlyBirdEndsAtISO={pricing.earlyBirdEndsAtISO}
                  isEarlyBird={pricing.isEarlyBird}
                  pricingConfigured={pricing.configured}
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
