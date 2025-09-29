"use client";

import { OnboardingLayout } from "@/features/onboarding/freelancer/onboarding-layout";
import { StepSidebar } from "@/features/onboarding/freelancer/components/step-sidebar";
import BasicInformationStep from "@/features/onboarding/freelancer/steps/basic-information";

export default function FreelancerBasicInformationPage() {
  const steps = [
    { id: "basic", title: "Basic Information" },
    { id: "skills", title: "Skills & Role" },
    { id: "portfolio", title: "Portfolio" },
    { id: "verification", title: "Verification" },
    { id: "agreement", title: "Agreement & Submit" },
  ];

  return (
    <OnboardingLayout>
      <div className="grid grid-cols-1 md:grid-cols-[320px,1fr] gap-8">
        <StepSidebar steps={steps} activeStepId="basic" />
        <BasicInformationStep />
      </div>
    </OnboardingLayout>
  );
}


