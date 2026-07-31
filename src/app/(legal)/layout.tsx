import Link from "next/link";
import { site } from "@/content/site";

/**
 * Shared chrome for the legal pages. Deliberately plain: these pages exist to
 * be read and to satisfy § 5 DDG, not to impress anyone.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col px-6 py-16">
      <Link
        href="/"
        className="text-eyebrow transition-colors hover:text-ink-dim"
      >
        ← {site.name}
      </Link>

      <div className="prose-legal mt-10 flex-1">{children}</div>

      <p className="mt-16 border-t border-line pt-6 font-mono text-[11px] text-ink-faint">
        © {new Date().getFullYear()} {site.name}
      </p>
    </div>
  );
}
