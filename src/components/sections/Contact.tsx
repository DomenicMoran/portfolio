"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Check, TriangleAlert } from "lucide-react";
import { contact, site } from "@/content/site";
import { Magnetic } from "@/components/ui/Magnetic";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;

    setStatus("sending");
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      setStatus("sent");
      form.reset();
    } catch {
      // Never swallow this into a fake success — the fallback below gives the
      // visitor a working path instead of a dead end.
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="relative scroll-mt-24 px-6 py-28 sm:py-40">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow={contact.eyebrow}
          title={contact.title}
          lede={contact.lede}
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_minmax(0,32rem)] lg:gap-20">
          {/* Direct route — always available, no JS required */}
          <Reveal>
            <div className="flex flex-col gap-8">
              <a
                href={`mailto:${site.email}`}
                className="group inline-flex max-w-full items-center gap-3 text-2xl font-semibold tracking-tight break-all text-ink transition-colors hover:text-acid sm:text-3xl"
              >
                {site.email}
                <ArrowRight
                  className="hidden size-6 shrink-0 transition-transform duration-300 group-hover:translate-x-1 sm:block"
                  aria-hidden
                />
              </a>

              <dl className="flex flex-col gap-4 border-t border-line pt-8">
                <div className="flex flex-col gap-1">
                  <dt className="text-eyebrow">Standort</dt>
                  <dd className="text-sm text-ink-dim">{site.location}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-eyebrow">Verfügbarkeit</dt>
                  <dd className="text-sm text-ink-dim">
                    {site.availability.label} · {site.availability.detail}
                  </dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-eyebrow">Antwortzeit</dt>
                  <dd className="text-sm text-ink-dim">In der Regel unter 24 Stunden</dd>
                </div>
              </dl>
            </div>
          </Reveal>

          {/* Form */}
          <Reveal delay={0.08}>
            <form
              onSubmit={handleSubmit}
              className="lit flex flex-col gap-5 rounded-2xl border border-line bg-surface/50 p-7 sm:p-8"
            >
              {/* Honeypot: bots fill it, humans never see it. */}
              <div className="absolute -left-[9999px]" aria-hidden>
                <label htmlFor="website">Website</label>
                <input id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="name"
                  name="name"
                  label={contact.formLabels.name}
                  required
                  autoComplete="name"
                />
                <Field
                  id="email"
                  name="email"
                  type="email"
                  label={contact.formLabels.email}
                  required
                  autoComplete="email"
                />
              </div>

              <Field
                id="company"
                name="company"
                label={contact.formLabels.company}
                autoComplete="organization"
              />

              <div className="flex flex-col gap-2">
                <label htmlFor="message" className="text-eyebrow">
                  {contact.formLabels.message}
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="resize-y rounded-xl border border-line bg-base px-4 py-3 text-sm text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-acid/60"
                  placeholder="Worum geht es?"
                />
              </div>

              <Magnetic className="self-start" strength={0.2}>
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className={cn(
                    "group inline-flex items-center gap-2 rounded-full px-6 py-3.5 font-medium transition-colors",
                    status === "sending"
                      ? "cursor-wait bg-raised text-ink-faint"
                      : "bg-acid text-void hover:bg-ink",
                  )}
                >
                  {status === "sending"
                    ? contact.formLabels.sending
                    : contact.formLabels.submit}
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </Magnetic>

              <div aria-live="polite" className="min-h-6">
                {status === "sent" ? (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: ease.expo }}
                    className="flex items-center gap-2 text-sm text-acid"
                  >
                    <Check className="size-4" aria-hidden />
                    {contact.formLabels.success}
                  </motion.p>
                ) : null}

                {status === "error" ? (
                  <motion.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: ease.expo }}
                    className="flex flex-wrap items-center gap-2 text-sm text-ink-dim"
                  >
                    <TriangleAlert className="size-4 shrink-0 text-acid" aria-hidden />
                    {contact.formLabels.error}{" "}
                    <a
                      href={`mailto:${site.email}`}
                      className="text-acid underline underline-offset-4"
                    >
                      {site.email}
                    </a>
                  </motion.p>
                ) : null}
              </div>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-eyebrow">
        {label}
        {required ? <span className="ml-1 text-acid">*</span> : null}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="rounded-xl border border-line bg-base px-4 py-3 text-sm text-ink transition-colors outline-none placeholder:text-ink-faint focus:border-acid/60"
      />
    </div>
  );
}
