import { useParams } from "wouter";
import { sections, type TechSection } from "@shared/schema";
import { TechCards } from "@/components/tech-cards";
import { AIContent } from "@/components/ai-content";
import { DashboardLayout } from "@/components/layout/dashboard";

export default function TechSectionPage() {
  const params = useParams<{ section: string }>();
  const section = params.section as TechSection;

  if (!sections.includes(section)) {
    return <div>Invalid section</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          {section.charAt(0).toUpperCase() + section.slice(1)} Development
        </h1>
        <TechCards section={section} />
        <AIContent section={section} />
      </div>
    </DashboardLayout>
  );
}
