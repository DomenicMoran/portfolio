"use client";

import { ContentProviderDe } from "@/content/ContentProviderDe";
import { de } from "@/content/de";
import { About } from "@/components/sections/About";
import { BookPublication } from "@/components/sections/BookPublication";
import { Produkte } from "@/components/sections/Produkte";

export function HomeLateDeLight() {
  return (
    <ContentProviderDe>
      <div className="[content-visibility:auto]">
        <About />
        <BookPublication />
        <Produkte produkte={de.produkte} />
      </div>
    </ContentProviderDe>
  );
}
