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

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export type BookPartyClientProps = {
  earlyBirdEndsAtISO: string | null;
  isEarlyBird: boolean;
  pricingConfigured: boolean;
};

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-3xl font-bold tabular-nums text-amber-900 dark:text-amber-100 sm:text-4xl">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-xs uppercase tracking-wide text-amber-700/70 dark:text-amber-300/70">
        {label}
      </span>
    </div>
  );
}

function EarlyBirdBanner({ endsAtISO }: { endsAtISO: string }) {
  const [remaining, setRemaining] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const end = new Date(endsAtISO).getTime();
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      if (ms <= 0) {
        setExpired(true);
        return;
      }
      const total = Math.floor(ms / 1000);
      setRemaining({
        d: Math.floor(total / 86400),
        h: Math.floor((total % 86400) / 3600),
        m: Math.floor((total % 3600) / 60),
        s: total % 60,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAtISO]);

  if (expired) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Early bird pricing has ended
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Tickets are now <span className="font-bold">$200</span>.
        </p>
      </div>
    );
  }

  if (!remaining) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center dark:border-amber-700 dark:bg-amber-950/40">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
        Early bird pricing
      </p>
      <p className="mt-2 text-zinc-800 dark:text-zinc-200">
        <span className="text-3xl font-bold text-amber-900 dark:text-amber-100 sm:text-4xl">
          $150
        </span>{" "}
        <span className="text-base text-zinc-500 line-through dark:text-zinc-500">
          $200
        </span>
      </p>
      <p className="mt-1 text-sm text-amber-800/80 dark:text-amber-300/80">
        Price increases to $200 when the timer hits zero
      </p>
      <div className="mx-auto mt-5 flex max-w-xs justify-center gap-4">
        <CountdownUnit value={remaining.d} label="days" />
        <span className="pt-1 text-2xl font-bold text-amber-900/40 dark:text-amber-100/40">
          :
        </span>
        <CountdownUnit value={remaining.h} label="hrs" />
        <span className="pt-1 text-2xl font-bold text-amber-900/40 dark:text-amber-100/40">
          :
        </span>
        <CountdownUnit value={remaining.m} label="min" />
        <span className="pt-1 text-2xl font-bold text-amber-900/40 dark:text-amber-100/40">
          :
        </span>
        <CountdownUnit value={remaining.s} label="sec" />
      </div>
    </div>
  );
}

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
          pricing_tier?: string | null;
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
          pricing_tier: data.pricing_tier ?? "unknown",
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
        Confirming your payment…
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
        You&apos;re in — thank you!
      </h2>
      <p className="mt-3 text-emerald-800 dark:text-emerald-200">
        We&apos;ll follow up with event details. Check your inbox (and spam)
        for confirmation.
      </p>
    </div>
  );
}

export function BookPartyClient({
  earlyBirdEndsAtISO,
  isEarlyBird,
  pricingConfigured,
}: BookPartyClientProps) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? null;

  const fetchClientSecret = useCallback(async () => {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const res = await fetch("/api/book-party/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnPath: pathname, colorScheme }),
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
    <div className="space-y-6">
      {pricingConfigured && isEarlyBird && earlyBirdEndsAtISO && (
        <EarlyBirdBanner endsAtISO={earlyBirdEndsAtISO} />
      )}

      {pricingConfigured && !isEarlyBird && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Tickets — <span className="font-bold">$200</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Hotel + boat + signed book included
          </p>
        </div>
      )}

      {!pricingConfigured && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-center dark:border-zinc-800 dark:bg-zinc-900/60">
          <p className="text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              $150
            </span>{" "}
            early bird ·{" "}
            <span className="font-semibold">$200</span> regular
          </p>
        </div>
      )}

      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={checkoutOptions}
      >
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-[#0a0a0a]">
          <EmbeddedCheckout />
        </div>
      </EmbeddedCheckoutProvider>
    </div>
  );
}
