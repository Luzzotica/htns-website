import { AuthorRequestForm } from "@/components/AuthorRequestForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function BecomeAnAuthorPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex flex-1 flex-col px-6 py-12">
        <div className="mx-auto w-full max-w-2xl">
          <section className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Become a How&nbsp;to&nbsp;Not&nbsp;Suck&#8482; Author
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
              Got real-world expertise and a knack for cutting through the noise?
              We&apos;re looking for authors who can turn complex topics into
              clear, no-BS guides that actually help people.
            </p>
            <p className="mt-3 text-zinc-500 dark:text-zinc-400">
              Fill out the form below and we&apos;ll be in touch.
            </p>
          </section>

          <div className="mt-10">
            <AuthorRequestForm />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
