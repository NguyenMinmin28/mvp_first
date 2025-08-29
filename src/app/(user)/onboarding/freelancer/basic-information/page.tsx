import { getServerSessionUser } from "@/features/auth/auth-server";
import { UserLayout } from "@/features/shared/components/user-layout";
import { StepSidebar } from "@/features/onboarding/freelancer/components/step-sidebar";
import BasicInformationStep from "@/features/onboarding/freelancer/steps/basic-information";

export default async function FreelancerBasicInformationPage() {
  const user = await getServerSessionUser();

  const steps = [
    { id: "basic", title: "Basic Information" },
    { id: "skills", title: "Skills & Role" },
    { id: "portfolio", title: "Portfolio" },
    { id: "verification", title: "Verification" },
    { id: "agreement", title: "Agreement & Submit" },
  ];

  return (
    <UserLayout user={user}>
      <section className="w-full py-8">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-[320px,1fr] gap-8">
          <StepSidebar steps={steps} activeStepId="basic" />
          <BasicInformationStep />
        </div>
      </section>
    </UserLayout>
  );
}


