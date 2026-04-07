"use client";

import { useSyncExternalStore } from "react";

/** April 18, 2026 00:00:00 America/New_York (EDT → UTC). */
const BOOK_PARTY_EVENT_START_MS = Date.parse("2026-04-18T04:00:00.000Z");

function subscribe(onTick: () => void) {
  const id = window.setInterval(onTick, 1000);
  return () => window.clearInterval(id);
}

function formatUnit(value: number, label: string) {
  return (
    <div className="flex min-w-[3.25rem] flex-col items-center rounded-lg border border-zinc-200 bg-white px-2 py-2 dark:border-zinc-700 dark:bg-zinc-900/60">
      <span className="font-mono text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </span>
      <span className="text-[0.65rem] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export function BookPartyEventCountdown() {
  const now = useSyncExternalStore(
    subscribe,
    () => Date.now(),
    () => 0
  );

  if (now === 0) {
    return (
      <div
        className="mt-6 h-[4.25rem] w-full max-w-md animate-pulse rounded-lg bg-zinc-200/60 dark:bg-zinc-800/50"
        aria-hidden
      />
    );
  }

  const diff = BOOK_PARTY_EVENT_START_MS - now;
  if (diff <= 0) {
    return (
      <p className="mt-6 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        It&apos;s Book Party day — see you there!
      </p>
    );
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="mt-6">
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
        Event starts in
      </p>
      <div
        className="mt-3 flex flex-wrap justify-center gap-2 sm:gap-3"
        role="timer"
        aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds until the Book Party`}
      >
        {formatUnit(days, "Days")}
        {formatUnit(hours, "Hrs")}
        {formatUnit(minutes, "Min")}
        {formatUnit(seconds, "Sec")}
      </div>
    </div>
  );
}
