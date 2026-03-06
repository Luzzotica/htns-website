import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <Link
              href="/privacy-policy"
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-of-use"
              className="hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Terms of Use
            </Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Copyright © 2025 How To Not Suck. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
