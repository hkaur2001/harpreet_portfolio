import type { Metadata } from "next";
import { AtlasResearchDesk } from "@/components/atlas-research-desk";

export const metadata: Metadata = {
  title: "Atlas — Financial Research Desk",
  description:
    "A live financial-workflow agent that reconciles synthetic evidence, runs reproducible calculations, and produces cited briefs with human review and a bounded deployment pilot.",
};

export default function AtlasPage() {
  return <AtlasResearchDesk />;
}
