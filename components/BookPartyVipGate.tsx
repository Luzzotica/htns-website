"use client";

import { BOOK_PARTY_REGISTERED_STORAGE_KEY } from "@/lib/book-party-funnel";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Ensures users hit free registration before VIP upsell, unless returning
 * from Stripe with session_id.
 */
export function BookPartyVipGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? null;
  const [allowed, setAllowed] = useState<boolean | null>(() =>
    sessionId ? true : null
  );

  useEffect(() => {
    if (sessionId) return;
    queueMicrotask(() => {
      if (typeof sessionStorage === "undefined") {
        setAllowed(false);
        router.replace("/htns-book-party/register");
        return;
      }
      if (sessionStorage.getItem(BOOK_PARTY_REGISTERED_STORAGE_KEY) === "1") {
        setAllowed(true);
        return;
      }
      setAllowed(false);
      router.replace("/htns-book-party/register");
    });
  }, [router, sessionId]);

  if (allowed === null || !allowed) {
    return (
      <p className="text-center text-zinc-500 dark:text-zinc-400">
        Loading&hellip;
      </p>
    );
  }

  return <>{children}</>;
}
