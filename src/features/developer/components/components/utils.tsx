import { Badge } from "@/ui/components/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "accepted":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "expired":
      return <Clock className="h-4 w-4 text-gray-500" />;
    case "invalidated":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-blue-500" />;
  }
};

export const getLevelBadge = (level: string) => {
  const colors = {
    EXPERT: "bg-purple-100 text-purple-800",
    MID: "bg-blue-100 text-blue-800",
    FRESHER: "bg-green-100 text-green-800",
  } as const;

  return <Badge className={(colors as any)[level] || colors.MID}>{level}</Badge>;
};

export const formatDate = (dateString: string) => new Date(dateString).toLocaleString();

export const computeTimeRemaining = (now: Date, deadline: string) => {
  const nowMs = now.getTime();
  const deadlineMs = new Date(deadline).getTime();
  const remaining = deadlineMs - nowMs;
  if (remaining <= 0) return { text: "Expired", color: "text-red-500", urgent: false } as const;

  const totalMinutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  const isUrgent = totalMinutes < 5;
  const color = isUrgent ? "text-red-500" : totalMinutes < 10 ? "text-yellow-500" : "text-green-500";

  let displayText: string;
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60);
    const remainingMins = totalMinutes % 60;
    displayText = `${hours}h ${remainingMins}m`;
  } else if (totalMinutes > 0) {
    displayText = `${totalMinutes}m ${seconds}s`;
  } else {
    displayText = `${seconds}s`;
  }

  return { text: displayText, color, urgent: isUrgent, totalSeconds: Math.floor(remaining / 1000) } as const;
};


