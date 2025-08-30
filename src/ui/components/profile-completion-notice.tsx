import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/ui/components/button";
import { cn } from "@/core/utils/utils";

interface ProfileCompletionNoticeProps {
  className?: string;
  onCompleteProfile?: () => void;
}

export function ProfileCompletionNotice({
  className,
  onCompleteProfile,
}: ProfileCompletionNoticeProps) {
  return (
    <div
      className={cn(
        "bg-blue-50 border border-blue-200 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            Complete Your Profile
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            Please complete your profile to access all features and receive project invitations.
          </p>

          {onCompleteProfile && (
            <Button
              onClick={onCompleteProfile}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Hoàn thành hồ sơ
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
