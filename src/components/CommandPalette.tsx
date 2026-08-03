"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScrollSperre } from "@/lib/scroll-lock";
import { mailAdresse } from "@/lib/mailto";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  FileText,
  Mail,
  Scale,
  Search,
} from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { useContent } from "@/content/ContentProvider";
import { artikelIn, chromeIn } from "@/content/articles";
import { SOCIALS } from "@/content/types";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Action = {
  id: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

/**
 * Die ⌘K-Palette. Zwei Gründe, warum sie ihren Platz im Bündel wert ist: Jede
 * Aktion ist auch über die gewöhnliche Navigation erreichbar, sie ist also
 * reine Zugabe — und das Publikum, Entwickler, drückt ⌘K tatsächlich.
 */
/** Feste Kennungen, damit `aria-controls` und `aria-activedescendant` auflösen. */
const LISTEN_ID = "befehlspalette-liste";
const eintragId = (i: number) => `befehlspalette-eintrag-${i}`;

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const {
    nav: navItems,
    navContact,
    footer,
    caseStudies,
    site,
    recruiter,
    palette,
    lang,
  } = useContent();
  const artikel = artikelIn(lang);
  const chrome = chromeIn(lang);
  const heim = lang === "de" ? "/" : "/en";
  useScrollSperre(open);

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const actions = useMemo<Action[]>(() => {
    // Auf der Startseite gibt es das Ziel im Dokument, dann wird gescrollt.
    // Auf einer Unterseite gibt es es nicht, und ohne diesen Zweig passierte
    // beim Auswählen schlicht nichts.
    const go = (hash: string) => () => {
      onClose();
      const ziel = document.querySelector(hash);
      if (ziel) {
        ziel.scrollIntoView({ behavior: "smooth" });
        return;
      }
      window.location.href = `${heim}${hash}`;
    };
    const goto = (pfad: string) => () => {
      onClose();
      window.location.href = pfad;
    };
    const open_ = (href: string) => () => {
      onClose();
      window.open(href, "_blank", "noopener,noreferrer");
    };

    const list: Action[] = [
      ...navItems.map((item) => ({
        id: `nav-${item.href}`,
        label: item.label,
        hint: palette.jump,
        icon: ArrowRight,
        run: go(item.href),
      })),
      ...caseStudies.map((study) => ({
        id: `case-${study.id}`,
        label: study.name,
        hint: study.tagline,
        icon: ArrowRight,
        run: go(`#case-${study.id}`),
      })),
      ...artikel.map((a) => ({
        id: `artikel-${a.slug}`,
        label: a.title,
        hint: chrome.eyebrow,
        icon: BookOpen,
        run: goto(`${chrome.base}/${a.slug}`),
      })),
      {
        id: "pdf",
        label: palette.pdf.label,
        hint: palette.pdf.hint,
        icon: FileText,
        run: () => {
          onClose();
          window.open(recruiter.cta.pdf.href, "_blank", "noopener,noreferrer");
        },
      },
      /* Der Kontaktbereich stand nicht in der Liste.
         Die Kopfleiste bietet ihn als eigenen Knopf an, die Palette bildet
         aber nur `navItems` ab, und dort steht er nicht. Wer „Kontakt" tippte,
         bekam „Nichts gefunden" — auf einer Seite, deren Zweck es ist, dass
         jemand Kontakt aufnimmt. */
      {
        id: "nav-contact",
        label: navContact,
        hint: palette.jump,
        icon: ArrowRight,
        run: go("#contact"),
      },
      {
        id: "mail",
        label: palette.mail,
        hint: site.email,
        icon: Mail,
        run: () => {
          onClose();
          window.location.href = mailAdresse(site.email, site.mailSubject);
        },
      },
    ];

    if (SOCIALS.github) {
      list.push({
        id: "gh",
        label: "GitHub",
        hint: palette.github,
        icon: GithubIcon,
        run: open_(SOCIALS.github),
      });
    }
    if (SOCIALS.linkedin) {
      list.push({
        id: "li",
        label: "LinkedIn",
        hint: palette.linkedin,
        icon: LinkedinIcon,
        run: open_(SOCIALS.linkedin),
      });
    }

    /* Die beiden Rechtsseiten gehoeren dazu.
       Sie stehen in der Fusszeile jeder Seite, wie § 5 DDG es verlangt — in
       der Palette fand „Impressum" trotzdem nichts. Wer sie mit der Tastatur
       sucht, sucht sie meistens gezielt. */
    list.push(
      {
        id: "impressum",
        label: footer.impressum,
        hint: footer.legalLabel,
        icon: Scale,
        run: goto("/impressum"),
      },
      {
        id: "datenschutz",
        label: footer.datenschutz,
        hint: footer.legalLabel,
        icon: Scale,
        run: goto("/datenschutz"),
      },
    );

    return list;
  }, [
    onClose,
    navItems,
    navContact,
    footer,
    caseStudies,
    site,
    recruiter,
    palette,
    artikel,
    chrome,
    heim,
  ]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q),
    );
  }, [actions, query]);

  // Reset during render rather than in an effect. React's documented pattern
  // für „Zustand anpassen, wenn sich eine Eigenschaft ändert": Es geschieht vor
  // dem Zeichnen, die alte Eingabe wird nie gerendert, und ein Nachziehen-Rendern entfällt.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive((i) => (i + 1) % Math.max(results.length, 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(
          (i) => (i - 1 + results.length) % Math.max(results.length, 1),
        );
      }
      if (event.key === "Enter") {
        event.preventDefault();
        results[active]?.run();
      }
    };

    /*
      Der Fokus bleibt im Dialog.

      Gemessen am 03.08.2026 an der ausgelieferten Seite: Bei geöffneter
      Palette führte die zweite Tabulatortaste hinaus in die Seite dahinter —
      „Projekte ansehen", „Für Recruiter", die Bildstrecke der ersten
      Fallstudie. Sichtbar verdeckt der Dialog diese Elemente, erreichbar
      blieben sie trotzdem. `aria-modal` sagt Vorleseprogrammen, dass der Rest
      stillsteht; die Tastatur hält sich nicht daran, solange niemand sie hält.

      Nicht über eine Liste der fokussierbaren Elemente: Die Ergebnisliste ist
      ein Scrollbereich, und Chrome macht solche Bereiche seit Version 127 von
      sich aus tastaturfokussierbar, ohne `tabindex`. Ein Auswahlausdruck
      übersieht sie deshalb — gemessen sprang der Fokus genau von dort nach
      draußen. Stattdessen wird beobachtet, wo er landet: Verlässt er den
      Dialog, holt ihn das Eingabefeld zurück. Das gilt für jede Art, ihn zu
      bewegen, nicht nur für die Tabulatortaste.
    */
    const beiFokus = (event: FocusEvent) => {
      const ziel = event.target as Node | null;
      if (!ziel || dialogRef.current?.contains(ziel)) return;
      inputRef.current?.focus();
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("focusin", beiFokus);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", beiFokus);
    };
  }, [open, results, active, onClose]);

  /*
     Steht bewusst *nach* dem Effekt darüber.

     React räumt Effekte in der Reihenfolge auf, in der sie stehen. Lag die
     Rückgabe vorher, holte der Fokuswächter den gerade zurückgegebenen Fokus
     sofort wieder ins Eingabefeld — und weil der Dialog im selben Moment
     verschwand, landete er im `body`. Gemessen: „nach Escape: BODY" statt am
     Knopf, von dem aus geöffnet wurde.
  */
  useEffect(() => {
    if (!open) return;

    /*
      Den Fokus merken und beim Schließen zurückgeben.

      Gemessen am 02.08.2026: Nach `Escape` stand der Fokus im `body`. Wer die
      Palette mit der Tastatur öffnet und wieder schließt, landete damit am
      Anfang des Dokuments und musste sich erneut durch alles tabben — genau
      dorthin, wo er vor dem Öffnen schon war.
    */
    const vorher = document.activeElement as HTMLElement | null;

    // Fokus erst, wenn der Auftritt beginnt — sonst scrollt Safari unter iOS.
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);

    return () => {
      window.clearTimeout(id);
      vorher?.focus?.();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          ref={dialogRef}
          /* Lenis darf Radbewegungen ueber der Palette nicht auf die Seite
             durchreichen. `overflow: hidden` an `<html>` allein reicht dafuer
             nicht: Lenis scrollt programmatisch und fragt den Ueberlauf nicht.
             Gemessen an der gebauten Seite lief der Hintergrund trotz Sperre
             von 0 auf 736 px. */
          data-lenis-prevent
          className="fixed inset-0 z-[9999] flex items-start justify-center bg-void/80 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={palette.title}
        >
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.3, ease: ease.expo }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60"
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="size-4 shrink-0 text-ink-faint" aria-hidden />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={palette.placeholder}
                className="w-full bg-transparent py-4 text-sm text-ink outline-none placeholder:text-ink-faint"
                aria-label={palette.searchLabel}
                /*
                  Ohne diese vier Angaben blättert man blind.

                  Die Pfeiltasten verschieben die Markierung sichtbar, der
                  Fokus bleibt aber im Eingabefeld — das ist das richtige
                  Muster. Eine Vorlesesoftware erfährt davon jedoch nur über
                  `aria-activedescendant`. Ohne sie hörte man beim Blättern
                  nichts, gemessen über drei Tastendrücke am 02.08.2026.
                */
                role="combobox"
                aria-expanded
                aria-autocomplete="list"
                aria-controls={LISTEN_ID}
                aria-activedescendant={
                  results[active] ? eintragId(active) : undefined
                }
              />
              <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
                ESC
              </kbd>
            </div>

            <ul
              id={LISTEN_ID}
              role="listbox"
              aria-label={palette.title}
              className="max-h-[52vh] overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-ink-faint">
                  {palette.empty}
                </li>
              ) : (
                results.map((action, i) => (
                  <li key={action.id} role="presentation">
                    <button
                      type="button"
                      id={eintragId(i)}
                      role="option"
                      aria-selected={i === active}
                      // Ein Eintrag ist über die Liste erreichbar, nicht über
                      // Tab: Sonst gäbe es zwei Wege durch dieselbe Auswahl.
                      tabIndex={-1}
                      onMouseEnter={() => setActive(i)}
                      onClick={action.run}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                        i === active ? "bg-raised" : "bg-transparent",
                      )}
                    >
                      <action.icon
                        className={cn(
                          "size-4 shrink-0",
                          i === active ? "text-acid" : "text-ink-faint",
                        )}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">
                          {action.label}
                        </span>
                        <span className="block truncate text-xs text-ink-faint">
                          {action.hint}
                        </span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
