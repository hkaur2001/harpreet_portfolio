import { EnoughPlanClient } from "@/components/enough-plan-client";

export const metadata = {
  title: "Enough — Find the version we can actually make",
  description: "A private social plan that locks only when enough people overlap on one executable time and place, then becomes the day-of coordination card.",
};

export default async function EnoughPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EnoughPlanClient slug={slug} />;
}
