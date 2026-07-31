"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, FileText, Mail, Search } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { useContent } from "@/content/ContentProvider";
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
 * ⌘K palette. Two reasons it earns its bundle cost on a portfolio:
 * every action is also reachable by normal navigation (so it is pure
 * enhancement), and the audience, engineers, will actually press ⌘K.
 */
export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { nav: navItems, caseStudies, site, recruiter, palette } = useContent();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = useMemo<Action[]>(() => {
    const go = (hash: string) => () => {
      onClose();
      document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
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
      {
        id: "mail",
        label: palette.mail,
        hint: site.email,
        icon: Mail,
        run: () => {
          onClose();
          window.location.href = `mailto:${site.email}`;
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

    return list;
  }, [onClose, navItems, caseStudies, site, recruiter, palette]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) || a.hint.toLowerCase().includes(q),
    );
  }, [actions, query]);

  // Reset during render rather than in an effect. React's documented pattern
  // for "adjust state when a prop changes": it happens before paint, so the
  // stale query is never rendered, and it avoids a cascading re-render.
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
    // Focus after the entrance transition starts, else iOS Safari scrolls.
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [open]);

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
        setActive((i) => (i - 1 + results.length) % Math.max(results.length, 1));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        results[active]?.run();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
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
              />
              <kbd className="hidden shrink-0 rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-ink-faint sm:block">
                ESC
              </kbd>
            </div>

            <ul className="max-h-[52vh] overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-ink-faint">
                  {palette.empty}
                </li>
              ) : (
                results.map((action, i) => (
                  <li key={action.id}>
                    <button
                      type="button"
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
