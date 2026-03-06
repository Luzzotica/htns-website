import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function PrivacyPolicyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
            Last updated: {new Date().toLocaleDateString("en-US")}
          </p>
          <div className="mt-8 space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              This privacy policy describes how How To Not Suck collects, uses,
              and protects your information when you use this website.
            </p>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Information We Collect
              </h2>
              <p className="mt-2">
                When you join our email list or provide your email address, we
                collect and store that information for the purpose of delivering
                updates, newsletters, and communicating with you about the How
                To Not Suck book series and related offerings.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                How We Use Your Information
              </h2>
              <p className="mt-2">
                We use your email address to send you the content you requested,
                to respond to inquiries, and to send occasional updates about
                How To Not Suck. We do not sell or share your information with
                third parties for marketing purposes.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Contact
              </h2>
              <p className="mt-2">
                If you have questions about this privacy policy, please contact
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
