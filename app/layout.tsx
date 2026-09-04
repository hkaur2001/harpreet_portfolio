import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Harpreet Kaur — Applied AI & Forward Deployed Engineering", template: "%s · Harpreet Kaur" },
  description: "Production AI systems, enterprise RAG, agent architectures, evaluation, integrations, and measurable workflow impact.",
  metadataBase: new URL(site.url),
  openGraph: { title: "Harpreet Kaur — AI systems that survive contact with the enterprise", description: "Forward deployed / applied AI engineering across agents, RAG, enterprise integrations, evals, governance, and business value.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body><Nav />{children}<Footer /></body></html>;
}
