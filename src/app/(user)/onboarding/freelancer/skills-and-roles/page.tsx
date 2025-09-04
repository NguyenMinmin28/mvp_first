export const revalidate = 0;

import { getServerSessionUser } from "@/features/auth/auth-server";
import { OnboardingLayout } from "@/features/onboarding/freelancer/onboarding-layout";
import { StepSidebar } from "@/features/onboarding/freelancer/components/step-sidebar";
import SkillsAndRolesStep from "@/features/onboarding/freelancer/steps/skills-and-roles";

export default async function FreelancerSkillsAndRolesPage() {
  const user = await getServerSessionUser();

  const steps = [
    { id: "basic", title: "Basic Information" },
    { id: "skills", title: "Skills & Role" },
    { id: "portfolio", title: "Portfolio" },
    { id: "verification", title: "Verification" },
    { id: "agreement", title: "Agreement & Submit" },
  ];

  return (
    <OnboardingLayout user={user}>
      <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-8">
        <StepSidebar steps={steps} activeStepId="skills" />
        <SkillsAndRolesStep />
      </div>
    </OnboardingLayout>
  );
}


