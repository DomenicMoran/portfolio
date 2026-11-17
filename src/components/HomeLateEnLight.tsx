"use client";

import { ContentProviderEn } from "@/content/ContentProviderEn";
import { en } from "@/content/en";
import { About } from "@/components/sections/About";
import { BookPublication } from "@/components/sections/BookPublication";
import { Produkte } from "@/components/sections/Produkte";

export function HomeLateEnLight() {
  return (
    <ContentProviderEn>
      <About />
      <BookPublication />
      <Produkte produkte={en.produkte} />
    </ContentProviderEn>
  );
}
