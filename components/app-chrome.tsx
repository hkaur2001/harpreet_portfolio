"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const standaloneProduct = pathname === "/enough" || pathname.startsWith("/enough/");
  if (standaloneProduct) return <>{children}</>;
  return <><Nav />{children}<Footer /></>;
}
