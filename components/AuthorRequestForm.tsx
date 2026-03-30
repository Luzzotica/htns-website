"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  authorRequestSchema,
  type AuthorRequestFormData,
} from "@/lib/validations";

const inputClassName =
  "w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-500 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:focus:border-zinc-100 dark:focus:ring-zinc-100";

const labelClassName =
  "block text-sm font-medium text-zinc-700 dark:text-zinc-300";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{message}</p>
  );
}

export function AuthorRequestForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AuthorRequestFormData>({
    resolver: zodResolver(authorRequestSchema),
  });

  const onSubmit = async (data: AuthorRequestFormData) => {
    setError(null);
    try {
      const res = await fetch("/api/become-an-author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ?? "Something went wrong. Please try again.",
        );
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  if (isSubmitted) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-8 text-center dark:border-emerald-700 dark:bg-emerald-950/40">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
          Application received!
        </p>
        <p className="mt-2 text-emerald-700 dark:text-emerald-400">
          Thanks for your interest in writing a How&nbsp;to&nbsp;Not&nbsp;Suck
          book. We&apos;ll review your submission and get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-6"
    >
      <div>
        <label htmlFor="fullName" className={labelClassName}>
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          placeholder="Jane Doe"
          {...register("fullName")}
          className={`mt-1.5 ${inputClassName}`}
          disabled={isSubmitting}
        />
        <FieldError message={errors.fullName?.message} />
      </div>

      <div>
        <label htmlFor="email" className={labelClassName}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register("email")}
          className={`mt-1.5 ${inputClassName}`}
          disabled={isSubmitting}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="bookTopic" className={labelClassName}>
          What topic would you like to write a &ldquo;How to Not Suck&rdquo;
          book about?
        </label>
        <input
          id="bookTopic"
          type="text"
          placeholder='e.g. "How to Not Suck at Public Speaking"'
          {...register("bookTopic")}
          className={`mt-1.5 ${inputClassName}`}
          disabled={isSubmitting}
        />
        <FieldError message={errors.bookTopic?.message} />
      </div>

      <div>
        <label htmlFor="targetAudience" className={labelClassName}>
          Who is the target audience for your book?
        </label>
        <input
          id="targetAudience"
          type="text"
          placeholder="e.g. college students, small business owners, new parents"
          {...register("targetAudience")}
          className={`mt-1.5 ${inputClassName}`}
          disabled={isSubmitting}
        />
        <FieldError message={errors.targetAudience?.message} />
      </div>

      <div>
        <label htmlFor="qualifications" className={labelClassName}>
          What makes you qualified to write about this topic?
        </label>
        <textarea
          id="qualifications"
          rows={4}
          placeholder="Share your background, experience, or credentials related to the topic."
          {...register("qualifications")}
          className={`mt-1.5 resize-y ${inputClassName}`}
          disabled={isSubmitting}
        />
        <FieldError message={errors.qualifications?.message} />
      </div>

      <div>
        <label htmlFor="previouslyPublished" className={labelClassName}>
          Have you written or published a book before?
        </label>
        <select
          id="previouslyPublished"
          {...register("previouslyPublished")}
          className={`mt-1.5 ${inputClassName}`}
          disabled={isSubmitting}
          defaultValue=""
        >
          <option value="" disabled>
            Select an option
          </option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
          <option value="currently-writing">Currently writing one</option>
        </select>
        <FieldError message={errors.previouslyPublished?.message} />
      </div>

      <div>
        <label htmlFor="additionalInfo" className={labelClassName}>
          Anything else you&apos;d like us to know?{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            (optional)
          </span>
        </label>
        <textarea
          id="additionalInfo"
          rows={3}
          placeholder="Links to your work, a brief book outline, or anything else relevant."
          {...register("additionalInfo")}
          className={`mt-1.5 resize-y ${inputClassName}`}
          disabled={isSubmitting}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? "Submitting..." : "Submit Application"}
      </button>
    </form>
  );
}
