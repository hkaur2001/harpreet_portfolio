import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: { default: "Harpreet Kaur — Software Engineering, Applied AI & Production Systems", template: "%s · Harpreet Kaur" },
  description: "Full-stack software, applied AI, data integrations, production systems, and end-to-end engineering by Harpreet Kaur.",
  metadataBase: new URL(site.url),
  openGraph: {
    title: "Harpreet Kaur — Software Engineering, Applied AI & Production Systems",
    description: "Full-stack products, working AI systems, live data projects, production integrations, evaluation, and reliability engineering.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="en"><body><Nav />{children}<Footer /></body></html>;
}
