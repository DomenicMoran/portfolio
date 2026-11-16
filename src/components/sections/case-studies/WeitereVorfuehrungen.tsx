"use client";

import { Reveal } from "@/components/ui/Reveal";
import { useContent } from "@/content/ContentProvider";
import dynamic from "next/dynamic";

const MacroDemo = dynamic(() =>
  import("@/components/demo/Macros").then((m) => m.MacroDemo),
);
const CheckoutDemo = dynamic(() =>
  import("@/components/demo/Checkout").then((m) => m.CheckoutDemo),
);

function WeitereVorfuehrungen({ fehlend }: { fehlend: readonly string[] }) {
  const inhalt = useContent();
  if (fehlend.length === 0) return null;

  return (
    <div className="mt-24 sm:mt-36">
      <h3 className="text-eyebrow mb-8">{inhalt.work.demosTitle}</h3>
      <div className="flex flex-col gap-16">
        {fehlend.includes("nouri") ? (
          <Reveal>
            <MacroDemo inhalt={inhalt} />
          </Reveal>
        ) : null}
        {fehlend.includes("dartile") ? (
          <Reveal delay={0.05}>
            <CheckoutDemo inhalt={inhalt} />
          </Reveal>
        ) : null}
      </div>
    </div>
  );
}

export { WeitereVorfuehrungen };
