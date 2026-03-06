import Image from "next/image";

interface BookCardProps {
  title: string;
  description: string;
  status: "available" | "coming-soon";
  coverSrc?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

export function BookCard({
  title,
  description,
  status,
  coverSrc,
  ctaHref,
  ctaLabel = "Visit Site",
}: BookCardProps) {
  const isComingSoon = status === "coming-soon";

  return (
    <div
      className={`rounded-xl border p-6 transition-all duration-300 ease-out hover:shadow-[0_0_24px_rgba(243,88,36,0.25)] ${
        isComingSoon
          ? "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50 opacity-75"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      {coverSrc && (
        <Image
          src={coverSrc}
          alt={`${title} book cover`}
          width={160}
          height={240}
          className="mx-auto rounded-lg shadow-md"
        />
      )}
      <h2 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h2>
      <span
        className={`mt-2 inline-block text-sm font-medium ${
          isComingSoon
            ? "text-zinc-500 dark:text-zinc-400"
            : "text-emerald-600 dark:text-emerald-400"
        }`}
      >
        {isComingSoon ? "Coming Soon" : "Available Now"}
      </span>
      <p className="mt-4 text-zinc-600 dark:text-zinc-400">{description}</p>
      {!isComingSoon && ctaHref && (
        <a
          href={ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {ctaLabel}
        </a>
      )}
    </div>
  );
}
