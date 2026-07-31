import Link from "next/link";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { navItems, site } from "@/content/site";

export function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    site.socials.github
      ? { label: "GitHub", href: site.socials.github, icon: GithubIcon }
      : null,
    site.socials.linkedin
      ? { label: "LinkedIn", href: site.socials.linkedin, icon: LinkedinIcon }
      : null,
  ].filter(Boolean) as { label: string; href: string; icon: typeof GithubIcon }[];

  return (
    <footer className="relative overflow-hidden border-t border-line px-6 pt-20 pb-10">
      <div className="mx-auto max-w-6xl">
        {/* Oversized wordmark — the closing note of the page. */}
        <p
          aria-hidden
          className="mb-16 bg-gradient-to-b from-ink/12 to-transparent bg-clip-text text-[clamp(3rem,15vw,11rem)] leading-[0.8] font-semibold tracking-[-0.05em] text-transparent select-none"
        >
          {site.name}
        </p>

        <div className="flex flex-col gap-10 border-t border-line pt-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink">
              {site.role} · {site.location}
            </p>
            <a
              href={`mailto:${site.email}`}
              className="-my-1 w-fit py-1 text-sm break-all text-ink-dim transition-colors hover:text-acid"
            >
              {site.email}
            </a>
          </div>

          {/* Gemessen: ohne die vertikale Polsterung waren diese Links 20 px
              hoch und lagen damit unter der WCAG-Mindestgröße von 24 px für
              Zeigeflächen. Der negative Rand hält die optische Ausrichtung. */}
          <nav aria-label="Fußzeile" className="-my-2 flex flex-wrap gap-x-6">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="py-2 text-sm text-ink-dim transition-colors hover:text-ink"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {socials.length > 0 ? (
            <div className="flex gap-2">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="grid size-10 place-items-center rounded-full border border-line text-ink-dim transition-colors hover:border-ink-faint hover:text-ink"
                >
                  <social.icon className="size-4" aria-hidden />
                </a>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-ink-faint">
            © {year} {site.name}
          </p>
          <div className="flex gap-6">
            <Link
              href="/impressum"
              className="-my-2 py-2 font-mono text-[11px] text-ink-faint transition-colors hover:text-ink-dim"
            >
              Impressum
            </Link>
            <Link
              href="/datenschutz"
              className="-my-2 py-2 font-mono text-[11px] text-ink-faint transition-colors hover:text-ink-dim"
            >
              Datenschutz
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
