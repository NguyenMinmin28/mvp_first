interface Step {
  id: string;
  title: string;
}

interface StepSidebarProps {
  steps: Step[];
  activeStepId: string;
}

export function StepSidebar({ steps, activeStepId }: StepSidebarProps) {
  return (
    <aside className="w-full md:w-80">
      <div className="rounded-xl border bg-gray-50">
        <ul className="p-6 space-y-6">
          {steps.map((step, index) => {
            const isActive = step.id === activeStepId;
            return (
              <li key={step.id} className="flex items-start gap-4">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold ${isActive ? "bg-black text-white" : "bg-gray-200 text-gray-600"}`}>
                  {index + 1}
                </div>
                <div className={`text-base font-semibold ${isActive ? "text-black" : "text-gray-400"}`}>{step.title}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}


