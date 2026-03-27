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

import type { BookPartyProduct } from "@/lib/book-party-pricing";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export type BookPartyClientProps = {
  initialBoatSeats: number | null;
  boatSeatsTotal: number;
  isEarlyBird: boolean;
};

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

// ── Product includes ─────────────────────────────────────────────────

const BOAT_INCLUDES = [
  "Private boat cruise (12\u20132 pm)",
  "On-board lunch",
  "Book signing & photos with Vince",
  "Networking before & after",
  "AC Hotel after-party (2:30\u20134:30 pm)",
];

const HOTEL_INCLUDES = [
  "AC Hotel event (2:30\u20134:30 pm)",
  "Speech by Vince Romney",
  "Networking with attendees",
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

function PriceBadge({
  earlyBird,
  regular,
  isEarlyBird,
}: {
  earlyBird: string;
  regular: string;
  isEarlyBird: boolean;
}) {
  if (isEarlyBird) {
    return (
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
          {earlyBird}
        </span>
        <span className="text-base text-zinc-400 line-through dark:text-zinc-500">
          {regular}
        </span>
      </div>
    );
  }
  return (
    <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
      {regular}
    </span>
  );
}

function ProductCard({
  product,
  label,
  earlyBirdPrice,
  regularPrice,
  isEarlyBird,
  includes,
  selected,
  onSelect,
  disabled,
  badge,
}: {
  product: BookPartyProduct;
  label: string;
  earlyBirdPrice: string;
  regularPrice: string;
  isEarlyBird: boolean;
  includes: string[];
  selected: boolean;
  onSelect: (p: BookPartyProduct) => void;
  disabled: boolean;
  badge?: React.ReactNode;
}) {
  const ring = selected
    ? "ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400"
    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600";

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(product)}
      disabled={disabled}
      className={`flex w-full flex-col rounded-xl border p-6 text-left transition-all ${ring} ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {label}
        </h3>
        <PriceBadge
          earlyBird={earlyBirdPrice}
          regular={regularPrice}
          isEarlyBird={isEarlyBird}
        />
      </div>
      {badge}
      <ul className="mt-4 space-y-1.5">
        {includes.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <span className="mt-0.5 text-emerald-500">&#10003;</span>
            {item}
          </li>
        ))}
      </ul>
      {selected && (
        <p className="mt-4 text-center text-sm font-medium text-blue-600 dark:text-blue-400">
          Selected &mdash; complete checkout below
        </p>
      )}
    </button>
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
            the ticket page
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center dark:border-emerald-900 dark:bg-emerald-950/40">
      <h2 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
        You&apos;re in &mdash; thank you!
      </h2>
      <p className="mt-3 text-emerald-800 dark:text-emerald-200">
        We&apos;ll follow up with event details. Check your inbox (and spam) for
        confirmation.
      </p>
    </div>
  );
}

// ── Main export ──────────────────────────────────────────────────────

export function BookPartyClient({
  initialBoatSeats,
  boatSeatsTotal,
  isEarlyBird,
}: BookPartyClientProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? null;

  const seats = useBoatSeats(initialBoatSeats);
  const [selectedProduct, setSelectedProduct] =
    useState<BookPartyProduct | null>(null);

  const boatSoldOut = seats.remaining !== null && seats.remaining <= 0;

  const handleSelect = useCallback(
    (product: BookPartyProduct) => {
      if (product === "boat-and-hotel") {
        seats.refresh();
      }
      setSelectedProduct((prev) => (prev === product ? null : product));
    },
    [seats],
  );

  const fetchClientSecret = useCallback(async () => {
    if (!selectedProduct) throw new Error("No product selected");
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const res = await fetch("/api/book-party/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        returnPath: pathname,
        product: selectedProduct,
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
  }, [pathname, selectedProduct]);

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
      <div className="grid gap-4 sm:grid-cols-2">
        <ProductCard
          product="boat-and-hotel"
          label="Boat Party + Hotel"
          earlyBirdPrice="$150"
          regularPrice="$200"
          isEarlyBird={isEarlyBird}
          includes={BOAT_INCLUDES}
          selected={selectedProduct === "boat-and-hotel"}
          onSelect={handleSelect}
          disabled={boatSoldOut}
          badge={
            <SeatsBadge
              remaining={seats.remaining}
              total={boatSeatsTotal}
              loading={seats.loading}
            />
          }
        />
        <ProductCard
          product="hotel-only"
          label="Hotel Only"
          earlyBirdPrice="$50"
          regularPrice="$75"
          isEarlyBird={isEarlyBird}
          includes={HOTEL_INCLUDES}
          selected={selectedProduct === "hotel-only"}
          onSelect={handleSelect}
          disabled={false}
        />
      </div>

      {selectedProduct && (
        <EmbeddedCheckoutProvider
          key={selectedProduct}
          stripe={stripePromise}
          options={checkoutOptions}
        >
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0a0a0a]">
            <EmbeddedCheckout />
          </div>
        </EmbeddedCheckoutProvider>
      )}
    </div>
  );
}
