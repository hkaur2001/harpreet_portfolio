import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, priority: 1 },
    { url: `${site.url}/projects`, priority: 1 },
    { url: `${site.url}/projects/sentinel`, priority: 1 },
    { url: `${site.url}/projects/secure-knowledge`, priority: 0.9 },
    { url: `${site.url}/projects/voice-agent`, priority: 0.9 },
    { url: `${site.url}/projects/research-agent`, priority: 0.9 },
    { url: `${site.url}/projects/policy-radar`, priority: 0.8 },
  ];
}
