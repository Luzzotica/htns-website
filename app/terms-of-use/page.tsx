import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function TermsOfUsePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 flex-col px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            ← Back
          </Link>
          <h1 className="mt-8 text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            Terms of Use
          </h1>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
          <div className="mt-8 space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              By using this website, you agree to these terms of use. Please
              read them carefully.
            </p>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Use of Content
              </h2>
              <p className="mt-2">
                All content on this website, including text, images, and
                downloadable materials, is provided for informational and
                educational purposes. Content may not be reproduced,
                distributed, or used for commercial purposes without prior
                written permission.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Accuracy
              </h2>
              <p className="mt-2">
                While we strive to provide accurate and up-to-date information,
                we make no warranties about the completeness or accuracy of the
                content. The information provided is for general guidance only
                and should not be considered professional advice.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Contact
              </h2>
              <p className="mt-2">
                If you have questions about these terms of use, please contact
                us through the contact information provided on this website.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
