"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { mailAdresse } from "@/lib/mailto";
import { useMemo, useState } from "react";
import { Menu, X, Command } from "lucide-react";
import Link from "next/link";
import { Marke } from "@/lib/mark";
import { useContent } from "@/content/ContentProvider";
import { useActiveSection } from "@/lib/useActiveSection";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function Nav({
  onOpenPalette,
  otherHref,
  hashBase = "",
}: {
  onOpenPalette: () => void;
  /**
   * Wohin der Sprachwechsel führt. Ohne Angabe die Startseite der anderen
   * Sprache. Ein Artikel reicht hier den Pfad seines Gegenstücks herein,
   * damit der Wechsel nicht auf der Startseite landet und den Leser aus dem
   * Text wirft.
   */
  otherHref?: string;
  /**
   * Vorsatz für die Sprungmarken. Auf der Startseite leer, weil "#work" dort
   * ein Ziel im Dokument ist. Auf einer Unterseite gibt es dieses Ziel nicht,
   * und der Link führte ins Leere; dort steht deshalb "/" oder "/en" davor.
   */
  hashBase?: string;
}) {
  const c = useContent();
  const { nav: navItems, site, a11y } = c;
  const sprachZiel = otherHref ?? (c.lang === "de" ? "/en" : "/");
  const zuAnker = (href: string) => `${hashBase}${href}`;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();

  // Aus "#work" wird "work". useMemo, weil useActiveSection das Array als
  // Abhängigkeit führt und eine neue Referenz je Render den Effekt sonst
  // bei jedem Scroll-Update neu aufsetzen würde.
  const ids = useMemo(
    () => navItems.map((item) => item.href.replace(/^#/, "")),
    [navItems],
  );
  const active = useActiveSection(ids);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 40);
  });

  return (
    <>
      {/* Auslauf hinter dem Header.
          Die Navigationsleiste ist eine Kapsel und deckt nur ihre eigene
          Fläche ab. Ohne diesen Verlauf lief der Fließtext beim Scrollen
          sichtbar oberhalb und neben der Kapsel weiter, auf schmalen Geräten
          sogar mitten hindurch. Gemessen auf 390 px war eine ganze Textzeile
          über der Leiste lesbar.
          Nur ein Farbverlauf, kein zweites backdrop-filter: Die Kapsel
          bringt ihre eigene Weichzeichnung schon mit, und eine zweite Fläche
          über die volle Breite kostet bei jedem Scroll-Schritt Füllrate. */}
      <div
        aria-hidden
        className={cn(
          // Deckend bis 66 % der Höhe, das sind 84 px. Die Leiste endet
          // gemessen bei 72 px (16 px Abstand + 56 px Kapsel). Erst
          // darunter beginnt der Auslauf, sonst scheint der Text auf Höhe
          // der Kapsel hindurch.
          "no-print pointer-events-none fixed inset-x-0 top-0 z-[9989] h-32 bg-[linear-gradient(to_bottom,var(--color-void)_0%,var(--color-void)_66%,transparent_100%)] transition-opacity duration-500",
          scrolled ? "opacity-100" : "opacity-0",
        )}
      />

      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: ease.expo, delay: 0.9 }}
        // Auf Papier ist eine Navigationsleiste nichts wert: Sie klebt fest,
        // landet dadurch über dem Inhalt der ersten Seite und bietet Ziele an,
        // die niemand anklicken kann.
        className="no-print fixed inset-x-0 top-0 z-[9990] px-4 pt-4 sm:px-6"
      >
        <nav
          aria-label={a11y.mainNav}
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled
              ? "border-line bg-base/70 backdrop-blur-xl"
              : "border-transparent bg-transparent",
          )}
        >
          <a
            href={hashBase || "#top"}
            // -my-1/py-1: die Trefferfläche wächst auf über 32 px, ohne dass
            // sich die Leiste optisch verändert.
            className="group -my-1 flex items-center gap-2.5 py-1"
            aria-label={a11y.toTop}
          >
            {/* Dasselbe Zeichen wie im Lesezeichen und auf der Vorschaukarte.
                Vorher stand hier ein dunkles D auf gruener Flaeche und dort
                ein gruenes auf dunkler: zwei Marken fuer dieselbe Seite. Die
                Form kommt jetzt aus einer Datei. */}
            <span className="relative grid size-7 shrink-0 place-items-center overflow-hidden rounded-md border border-acid/25 transition-colors group-hover:border-acid/60">
              <Marke size={28} radius={0} />
            </span>
            <span className="hidden text-sm font-medium tracking-tight text-ink sm:block">
              {site.name}
            </span>
          </a>

          {/* Umschaltpunkt lg statt md, gemessen.
              Bei md (768 px) erschien die volle Leiste und das Burger-Menue
              verschwand gleichzeitig, aber der Platz reichte nicht: Der
              Kontakt-Knopf lag bei x 772 bis 857 und damit vollstaendig
              ausserhalb der nutzbaren 768 px, waehrend zwei Menuepunkte auf
              zwei Zeilen umbrachen. Es gab keinen Querlauf, also schlug auch
              kein automatischer Test an. Betroffen war der ganze Bereich bis
              etwa 880 px, also Tablets im Hochformat. */}
          <ul className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const id = item.href.replace(/^#/, "");
              const istAktiv = active === id;
              return (
                <li key={item.href}>
                  <a
                    href={zuAnker(item.href)}
                    // aria-current sagt der Vorlesesoftware dasselbe, was die
                    // Pille dem Auge sagt. Ohne das wäre die Markierung rein
                    // dekorativ.
                    aria-current={istAktiv ? "true" : undefined}
                    className={cn(
                      "relative rounded-full px-3 py-1.5 text-sm transition-colors xl:px-3.5",
                      istAktiv ? "text-ink" : "text-ink-dim hover:text-ink",
                    )}
                  >
                    {istAktiv ? (
                      <motion.span
                        layoutId="nav-aktiv"
                        aria-hidden
                        className="absolute inset-0 -z-10 rounded-full bg-raised"
                        transition={{ duration: 0.4, ease: ease.expo }}
                      />
                    ) : null}
                    {item.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2">
            <Link
              href={sprachZiel}
              /* `lang` neben `hrefLang`: Beschriftung und Ansage stehen in
                  der Zielsprache — auf der englischen Seite also "Deutsch"
                  und "Diese Seite auf Deutsch". Ohne die Auszeichnung liest
                  ein Vorleseprogramm beides mit englischer Aussprache vor.
                  `hrefLang` sagt nur, was am Ziel liegt, nicht in welcher
                  Sprache der Verweis selbst geschrieben ist. */
              hrefLang={c.languageSwitch.to}
              lang={c.languageSwitch.to}
              aria-label={c.languageSwitch.aria}
              className="rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim"
            >
              {c.languageSwitch.label}
            </Link>

            <button
              type="button"
              onClick={onOpenPalette}
              // Erst ab xl sichtbar, gemessen: Bei genau 1024 px erscheint die
              // volle Leiste und braucht 76 px mehr, als da sind. Zwei
              // Menuepunkte brechen dann auf zwei Zeilen und die Leiste wird
              // 70 statt 56 px hoch. Der Tastaturhinweis ist der Teil, der am
              // wenigsten fehlt: Die Tastenkombination funktioniert weiterhin.
              className="hidden items-center gap-2 rounded-full border border-line px-3 py-1.5 font-mono text-[11px] text-ink-faint transition-colors hover:border-ink-faint hover:text-ink-dim xl:flex"
              aria-label={a11y.commandPalette}
            >
              <Command className="size-3" aria-hidden />
              <span>K</span>
            </button>

            <a
              href={zuAnker("#contact")}
              className="hidden rounded-full border border-transparent bg-ink px-4 py-1.5 text-sm font-medium text-void transition-colors hover:bg-acid sm:block"
            >
              {c.navContact}
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="grid size-9 place-items-center rounded-full border border-line text-ink-dim lg:hidden"
              aria-label={a11y.openMenu}
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
            className="fixed inset-0 z-[9995] bg-void/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <Link
                  href={sprachZiel}
                  hrefLang={c.languageSwitch.to}
                  lang={c.languageSwitch.to}
                  aria-label={c.languageSwitch.aria}
                  className="rounded-full border border-line px-3.5 py-2 font-mono text-[11px] text-ink-faint"
                >
                  {c.languageSwitch.label}
                </Link>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="grid size-10 place-items-center rounded-full border border-line text-ink"
                  aria-label={a11y.closeMenu}
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>

              <ul className="mt-10 flex flex-col">
                {navItems.map((item, i) => {
                  const id = item.href.replace(/^#/, "");
                  const istAktiv = active === id;
                  return (
                    <motion.li
                      key={item.href}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i, duration: 0.5, ease: ease.expo }}
                    >
                      <a
                        href={zuAnker(item.href)}
                        onClick={() => setMenuOpen(false)}
                        aria-current={istAktiv ? "true" : undefined}
                        className="flex items-center gap-3 border-b border-line py-4 text-3xl font-semibold tracking-tight text-ink"
                      >
                        {/* Der Punkt markiert den Abschnitt, in dem der Leser
                            gerade steht, damit das Menü nicht wie eine Liste
                            ohne Bezug wirkt. */}
                        <span
                          aria-hidden
                          className={cn(
                            "size-1.5 shrink-0 rounded-full transition-colors",
                            istAktiv ? "bg-acid" : "bg-transparent",
                          )}
                        />
                        {item.label}
                      </a>
                    </motion.li>
                  );
                })}
              </ul>

              <a
                href={mailAdresse(site.email, site.mailSubject)}
                className="mt-auto rounded-full border border-transparent bg-acid py-4 text-center font-medium text-void"
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
