import type { Metadata } from "next";
import { AtlasCommandCenter } from "@/components/atlas-command-center";

export const metadata: Metadata = {
  title: "Atlas — AI Deployment Command Center",
  description:
    "A live deployment-strategy agent that investigates workflow evidence and recommends a defensible first AI pilot with a safe 90-day rollout.",
};

export default function AtlasPage() {
  return <AtlasCommandCenter />;
}
