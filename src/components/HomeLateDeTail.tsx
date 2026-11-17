"use client";

import { ContentProviderDe } from "@/content/ContentProviderDe";
import { AiWorkflow, DeliverySpeed } from "@/components/sections/AiWorkflow";
import { Skills } from "@/components/sections/Skills";
import { Writing } from "@/components/sections/Writing";
import { RecruiterHub } from "@/components/sections/RecruiterHub";
import { Contact } from "@/components/sections/Contact";

export function HomeLateDeTail() {
  return (
    <ContentProviderDe>
      <div className="[content-visibility:auto]">
        <AiWorkflow />
        <DeliverySpeed />
        <Skills />
        <Writing />
        <RecruiterHub />
        <Contact />
      </div>
    </ContentProviderDe>
  );
}
