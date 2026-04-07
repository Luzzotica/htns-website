import { BookPartyRegistrationForm } from "@/components/BookPartyRegistrationForm";

export default function BookPartyRegisterPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-100 sm:text-3xl">
        Register for the Book Party
      </h1>
      <p className="mt-2 text-center text-zinc-600 dark:text-zinc-400">
        Free for everyone. Step 1 of 2.
      </p>
      <div className="mt-10">
        <BookPartyRegistrationForm />
      </div>
    </div>
  );
}
