import Link from "next/link";

export default function BookPartyThanksPage() {
  return (
    <div className="mx-auto w-full max-w-3xl text-center">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 dark:border-emerald-900 dark:bg-emerald-950/40">
        <h1 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100 sm:text-2xl">
          You&apos;re all set
        </h1>
        <p className="mt-3 text-emerald-800 dark:text-emerald-200">
          Thanks for registering. A confirmation email is on its way &mdash;
          check your inbox (and spam).
        </p>
        <p className="mt-6 text-sm text-emerald-800 dark:text-emerald-200">
          <Link
            href="/htns-book-party"
            className="font-medium underline hover:text-emerald-950 dark:hover:text-emerald-50"
          >
            Back to event page
          </Link>
        </p>
      </div>
    </div>
  );
}
