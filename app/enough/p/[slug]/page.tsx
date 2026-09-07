import { EnoughPlanClient } from "@/components/enough-plan-client";

export const metadata = {
  title: "Enough — Is this happening?",
  description: "A private plan that becomes real only when enough people commit.",
};

export default async function EnoughPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EnoughPlanClient slug={slug} />;
}
