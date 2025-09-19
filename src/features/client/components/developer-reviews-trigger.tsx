"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import DeveloperReviewsModal from "@/features/client/components/developer-reviews-modal";

interface DeveloperReviewsTriggerProps {
  developerId: string;
  developerName: string;
}

export default function DeveloperReviewsTrigger({ developerId, developerName }: DeveloperReviewsTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-3">
      <Button variant="outline" onClick={() => setOpen(true)} className="h-8 px-3 text-sm">
        Reviews
      </Button>
      <DeveloperReviewsModal
        isOpen={open}
        onClose={() => setOpen(false)}
        developerId={developerId}
        developerName={developerName}
      />
    </div>
  );
}


