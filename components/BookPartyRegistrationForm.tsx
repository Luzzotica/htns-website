"use client";

import {
  BOOK_PARTY_REGISTERED_STORAGE_KEY,
  BOOK_PARTY_VIP_FUNNEL_URL,
} from "@/lib/book-party-funnel";
import Link from "next/link";
import { useCallback, useState } from "react";

export function BookPartyRegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/book-party/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
          }),
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        if (typeof sessionStorage !== "undefined") {
          sessionStorage.setItem(BOOK_PARTY_REGISTERED_STORAGE_KEY, "1");
        }
        window.location.assign(BOOK_PARTY_VIP_FUNNEL_URL);
      } catch {
        setError("Network error. Try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, firstName, lastName],
  );

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-6 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <div>
        <label
          htmlFor="bp-first"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          First name
        </label>
        <input
          id="bp-first"
          name="firstName"
          type="text"
          autoComplete="given-name"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="bp-last"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Last name
        </label>
        <input
          id="bp-last"
          name="lastName"
          type="text"
          autoComplete="family-name"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>
      <div>
        <label
          htmlFor="bp-email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Email
        </label>
        <input
          id="bp-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {loading ? "Saving…" : "Continue"}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/htns-book-party" className="underline hover:text-zinc-700 dark:hover:text-zinc-300">
          Back to event page
        </Link>
      </p>
    </form>
  );
}
