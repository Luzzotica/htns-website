"use client";

import { useEffect, useState } from "react";

function Unit({ value, label }: { value: number; label: string }) {
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

const SEP = (
  <span className="pt-1 text-2xl font-bold text-amber-900/40 dark:text-amber-100/40">
    :
  </span>
);

export function EarlyBirdCountdown({ endsAtISO }: { endsAtISO: string }) {
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

  if (expired || !remaining) return null;

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 px-6 py-5 text-center dark:border-amber-700 dark:bg-amber-950/40">
      <p className="text-sm font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
        Early bird pricing ends in
      </p>
      <div className="mx-auto mt-3 flex max-w-xs justify-center gap-4">
        <Unit value={remaining.d} label="days" />
        {SEP}
        <Unit value={remaining.h} label="hrs" />
        {SEP}
        <Unit value={remaining.m} label="min" />
        {SEP}
        <Unit value={remaining.s} label="sec" />
      </div>
    </div>
  );
}
