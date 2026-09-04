import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
export default function sitemap(): MetadataRoute.Sitemap { return [{ url: site.url, priority: 1 }, { url: `${site.url}/work/enterprise-ai-ops-agent`, priority: 0.9 }, { url: `${site.url}/labs`, priority: 0.8 }]; }
