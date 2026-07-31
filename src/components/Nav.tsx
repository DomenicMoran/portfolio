"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { Menu, X, Command } from "lucide-react";
import { navItems, site } from "@/content/site";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Nav({ onOpenPalette }: { onOpenPalette: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: ease.expo, delay: 0.9 }}
        className="fixed inset-x-0 top-0 z-[9990] px-4 pt-4 sm:px-6"
      >
        <nav
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled
              ? "border-line bg-base/70 backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <a
            href="#top"
            className="group flex items-center gap-2.5"
            aria-label="Zum Seitenanfang"
          >
            <span className="relative grid size-7 shrink-0 place-items-center rounded-md bg-acid font-mono text-[13px] font-bold text-void">
              D
            </span>
            <span className="hidden text-sm font-medium tracking-tight text-ink sm:block">
              {site.name}
            </span>
          </a>

          <ul className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="relative rounded-full px-3.5 py-1.5 text-sm text-ink-dim transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenPalette}
              className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim sm:flex"
              aria-label="Befehlspalette öffnen"
            >
              <Command className="size-3" aria-hidden />
              <span>K</span>
            </button>

            <a
              href="#contact"
              className="hidden rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-void transition-colors hover:bg-acid sm:block"
            >
              Kontakt
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-8 place-items-center rounded-full border border-line text-ink-dim md:hidden"
              aria-label="Menü öffnen"
            >
              <Menu className="size-4" aria-hidden />
            </button>
          </div>
        </nav>
      </motion.header>

      {/* Mobile sheet */}
      <AnimatePresence>
        {menuOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9995] bg-void/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex h-full flex-col p-6">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid size-10 place-items-center rounded-full border border-line text-ink"
                  aria-label="Menü schließen"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <ul className="mt-12 flex flex-col gap-2">
                {navItems.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.06 * i, duration: 0.5, ease: ease.expo }}
                  >
                    <a
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="block border-b border-line py-4 text-3xl font-semibold tracking-tight text-ink"
                    >
                      {item.label}
                    </a>
                  </motion.li>
                ))}
              </ul>

              <a
                href={`mailto:${site.email}`}
                className="mt-auto rounded-full bg-acid py-4 text-center font-medium text-void"
              >
                {site.email}
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
