"use client";

import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/content/ContentProvider";

function Werkbank() {
  const { werkbank } = useContent();

  return (
    <div className="border-line mt-24 border-t pt-12 sm:mt-36">
      <h3 className="text-eyebrow mb-3">{werkbank.title}</h3>
      <p className="text-ink-dim mb-8 max-w-[68ch] text-sm leading-relaxed text-pretty">
        {werkbank.lede}
      </p>

      <ul className="grid gap-4 sm:grid-cols-3">
        {werkbank.items.map((item, i) => (
          <Reveal as="li" key={item.name} delay={i * 0.05}>
            <div className="border-line bg-surface/40 flex h-full flex-col rounded-xl border p-5">
              <span className="text-ink font-mono text-sm">{item.name}</span>
              <span className="text-ink-dim mt-2.5 block text-sm leading-relaxed text-pretty">
                {item.body}
              </span>
              <span className="text-ink-faint mt-auto block pt-4 font-mono text-[10px]">
                {item.stand}
              </span>
            </div>
          </Reveal>
        ))}
      </ul>
    </div>
  );
}

export { Werkbank };
