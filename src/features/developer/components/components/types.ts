export interface InvitationCandidate {
  id: string;
  level: "EXPERT" | "MID" | "FRESHER";
  responseStatus: "pending" | "accepted" | "rejected" | "expired" | "invalidated";
  acceptanceDeadline: string;
  assignedAt: string;
  respondedAt?: string;
  isFirstAccepted: boolean;
  source?: "AUTO_ROTATION" | "MANUAL_INVITE";
  clientMessage?: string;
  batch: {
    id: string;
    status: string;
    type?: "AUTO_ROTATION" | "MANUAL_INVITE";
    isNoExpire?: boolean;
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


