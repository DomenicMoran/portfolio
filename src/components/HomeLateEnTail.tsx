"use client";

import { ContentProviderEn } from "@/content/ContentProviderEn";
import { AiWorkflow, DeliverySpeed } from "@/components/sections/AiWorkflow";
import { Skills } from "@/components/sections/Skills";
import { Writing } from "@/components/sections/Writing";
import { RecruiterHub } from "@/components/sections/RecruiterHub";
import { Contact } from "@/components/sections/Contact";

export function HomeLateEnTail() {
  return (
    <ContentProviderEn>
      <AiWorkflow />
      <DeliverySpeed />
      <Skills />
      <Writing />
      <RecruiterHub />
      <Contact />
    </ContentProviderEn>
  );
}
