import type { Metadata } from "next";
import Link from "next/link";
import { AtlasCommandCenter } from "@/components/atlas-command-center";
export const metadata: Metadata = { title: "Atlas — AI Deployment Command Center", description: "Compare first-pilot workflows and build a governed 90-day deployment plan." };
export default function AtlasStrategyPage() { return <><div className="desk-strategy-back"><Link href="/projects/atlas">← Back to Financial Research Desk</Link></div><AtlasCommandCenter /></>; }
