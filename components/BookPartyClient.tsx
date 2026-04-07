"use client";

import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";
import { track } from "@vercel/analytics/react";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PRODUCTS } from "@/lib/book-party-pricing";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export type BookPartyClientProps = {
  initialBoatSeats: number | null;
  boatSeatsTotal: number;
};

function formatUsd(cents: number): string {
  if (cents % 100 === 0) return `$${cents / 100}`;
  return `$${(cents / 100).toFixed(2)}`;
}

// ── Seat availability ────────────────────────────────────────────────

type SeatsState = {
  remaining: number | null;
  loading: boolean;
};

function useBoatSeats(
  initial: number | null,
): SeatsState & { refresh: () => void } {
  const [state, setState] = useState<SeatsState>({
    remaining: initial,
    loading: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const res = await fetch("/api/book-party/seats", {
        credentials: "same-origin",
      });
      if (res.ok) {
        const data = (await res.json()) as { remaining: number };
        setState({ remaining: data.remaining, loading: false });
      } else {
        setState((s) => ({ ...s, loading: false }));
      }
    } catch {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  return { ...state, refresh };
}

// ── VIP includes ───────────────────────────────────────────────────────

const VIP_INCLUDES = [
  "Private boat cruise (12\u20132 pm)",
  "On-board lunch",
  "Book signing & photos with Vince",
  "Networking before & after",
  "AC Hotel after-party (2:30\u20134:30 pm)",
];

// ── Sub-components ───────────────────────────────────────────────────

function SeatsBadge({
  remaining,
  total,
  loading,
}: {
  remaining: number | null;
  total: number;
  loading: boolean;
}) {
  if (remaining === null) return null;

  const pct = remaining / total;
  const color =
    remaining <= 0
      ? "text-red-600 dark:text-red-400"
      : pct <= 0.15
        ? "text-amber-600 dark:text-amber-400"
        : "text-emerald-600 dark:text-emerald-400";

  return (
    <p
      className={`mt-2 text-sm font-medium ${color} ${loading ? "opacity-60" : ""}`}
    >
      {remaining <= 0
        ? "Sold out"
        : `${remaining} of ${total} seats remaining`}
    </p>
  );
}

// ── Post-payment success ─────────────────────────────────────────────

function SuccessAfterPay({ sessionId }: { sessionId: string }) {
  const pathname = usePathname() ?? "/";
  const [status, setStatus] = useState<"checking" | "ok" | "fail">("checking");

  useEffect(() => {
    let cancelled = false;
    const storageKey = `htns_bp_conv_${sessionId}`;

    void (async () => {
      try {
        const res = await fetch(
          `/api/book-party/session-status?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "same-origin" },
        );
        const data = (await res.json()) as {
          ok?: boolean;
          product?: string | null;
          funnel?: string | null;
          amount_total?: number | null;
          currency?: string | null;
        };
        if (cancelled) return;
        if (!data.ok) {
          setStatus("fail");
          return;
        }

        if (typeof sessionStorage !== "undefined") {
          if (sessionStorage.getItem(storageKey)) {
            setStatus("ok");
            return;
          }
        }

        track("book_party_purchase", {
          product: data.product ?? "unknown",
          amount_cents: data.amount_total ?? 0,
          ...(data.funnel ? { funnel: data.funnel } : {}),
        });

        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
        if (!cancelled) setStatus("ok");
      } catch {
        if (!cancelled) setStatus("fail");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, pathname]);

  if (status === "checking") {
    return (
      <p className="text-zinc-600 dark:text-zinc-400">
        Confirming your payment&hellip;
      </p>
    );
  }

  if (status === "fail") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
        <p className="font-medium text-red-900 dark:text-red-200">
          We couldn&apos;t confirm this checkout session.
        </p>
        <p className="mt-2 text-sm text-red-800 dark:text-red-300">
          If you completed payment, check your email for a receipt or contact
          support. You can also return to{" "}
          <Link href={pathname} className="underline">
            the VIP upgrade page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
      <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
        Welcome to VIP &mdash; thank you!
      </h2>
      <p className="mt-3 text-emerald-800 dark:text-emerald-200">
        Your VIP ticket is confirmed. We&apos;ll send you another email with
        details and next steps &mdash; check your inbox (and spam).
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────

export function BookPartyClient({
  initialBoatSeats,
  boatSeatsTotal,
}: BookPartyClientProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? null;

  const seats = useBoatSeats(initialBoatSeats);
  const boatSoldOut = seats.remaining !== null && seats.remaining <= 0;

  const vipCents = PRODUCTS["boat-and-hotel"].regularCents;

  const fetchClientSecret = useCallback(async () => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const res = await fetch("/api/book-party/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnPath: pathname,
        colorScheme,
      }),
      credentials: "same-origin",
    });
    const data = (await res.json().catch(() => ({}))) as {
      clientSecret?: string;
      error?: string;
    };
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error ?? "Could not start checkout");
    }
    return data.clientSecret;
  }, [pathname]);

  const checkoutOptions = useMemo(
    () => ({ fetchClientSecret }),
    [fetchClientSecret],
  );

  if (sessionId) {
    return <SuccessAfterPay sessionId={sessionId} />;
  }

  if (!stripePromise) {
    return (
      <p className="text-center text-zinc-600 dark:text-zinc-400">
        Online ticket checkout is not configured yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-lg rounded-xl border border-zinc-200 p-6 text-left dark:border-zinc-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            VIP: Boat Party + Hotel
          </h3>
          <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {formatUsd(vipCents)}
          </span>
        </div>
        <SeatsBadge
          remaining={seats.remaining}
          total={boatSeatsTotal}
          loading={seats.loading}
        />
        <ul className="mt-4 space-y-1.5">
          {VIP_INCLUDES.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              <span className="mt-0.5 text-emerald-500">&#10003;</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link
          href="/htns-book-party/thanks"
          className="font-medium text-zinc-500 underline decoration-zinc-400 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          No thanks
        </Link>
        <span className="text-zinc-400 dark:text-zinc-500">
          {" "}
          &mdash; I&apos;ll keep my free registration only.
        </span>
      </p>

      {!boatSoldOut && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={checkoutOptions}
        >
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0a0a0a]">
            <EmbeddedCheckout />
          </div>
        </EmbeddedCheckoutProvider>
      )}

      {boatSoldOut && (
        <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
          VIP boat tickets are sold out. You&apos;re still registered for the
          free hotel session.
        </p>
      )}
    </div>
  );
}
