export interface InvitationCandidate {
  id: string;
  level: "EXPERT" | "MID" | "FRESHER";
  responseStatus: "pending" | "accepted" | "rejected" | "expired" | "invalidated";
  acceptanceDeadline: string;
  assignedAt: string;
  respondedAt?: string;
  isFirstAccepted: boolean;
  batch: {
    id: string;
    status: string;
    project: {
      id: string;
      title: string;
      description: string;
      skillsRequired: string[];
      status: string;
      client: {
        user: {
          name: string;
        };
        companyName?: string;
      };
    };
  };
  skills?: Array<{ name: string }>;
}


