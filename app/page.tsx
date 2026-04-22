import { Footer } from "@/components/Footer";
import { BookCard } from "@/components/BookCard";
import { EmailForm } from "@/components/EmailForm";
import Link from "next/link";

const CYBERSECURITY_URL = "https://howtonotsuckatcybersecurity.com";

export default async function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col px-6 py-16">
        <div className="mx-auto max-w-4xl">
          {/* Hero */}
          <section className="mt-20 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
              HOW TO NOT SUCK
            </h1>
            <p className="mt-6 text-2xl font-medium text-zinc-700 dark:text-zinc-300">
              Live better. Suck less.
            </p>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Clear and useful guides on real-world topics.
            </p>
          </section>

          {/* Book cards */}
          <section className="mt-20 grid gap-8 sm:grid-cols-2">
            <BookCard
              title="How to Not Suck at Cybersecurity"
              description="Practical, actionable advice for regular people, small business owners, and executives to suck less at cybersecurity."
              status="available"
              coverSrc="/cover.jpg"
              ctaHref={CYBERSECURITY_URL}
              ctaLabel="Get the First Chapter Free"
            />
            <BookCard
              title="How to Not Suck at Money"
              description="Your straightforward, no-fluff guide to getting your financial life together. Budgeting, saving, debt management, and wealth building that actually makes sense."
              status="coming-soon"
            />
          </section>

          {/* Email list */}
          <section className="mt-20 text-center">
            <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Join the email list
            </h2>
            <p className="mx-auto mt-4 max-w-md text-zinc-600 dark:text-zinc-400">
              Get updates on new books, tips, and resources.
            </p>
            <div className="mx-auto mt-8 max-w-sm">
              <EmailForm submitLabel="Join the list" />
            </div>
          </section>

          {/* Become an author */}
          <section className="mt-20 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              Interested in writing a How&nbsp;to&nbsp;Not&nbsp;Suck book?{" "}
              <Link
                href="/become-an-author"
                className="font-medium text-zinc-900 underline underline-offset-4 transition-colors hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-300"
              >
                Apply to become an author
              </Link>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
