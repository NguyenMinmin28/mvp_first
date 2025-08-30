"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";

interface VerificationTabProps {
  profileData: any;
  isEditing: boolean;
}

export default function VerificationTab({
  profileData,
  isEditing,
}: VerificationTabProps) {
  const handleSubmitForApproval = async () => {
    try {
      // Call API to submit profile for approval
      const response = await fetch("/api/user/submit-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit profile for approval"
        );
      }

      const result = await response.json();
      console.log("Profile submitted successfully:", result);

      // TODO: Update local state or trigger refresh
      // This will be implemented when we add state management

      // Show success message
      alert(
        "Profile submitted for approval successfully! Your status is now PENDING."
      );
    } catch (error) {
      console.error("Error submitting profile:", error);
      alert(
        `Error: ${error instanceof Error ? error.message : "Failed to submit profile"}`
      );
    }
  };

  console.log(profileData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verification Documents</CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge
            variant={
              profileData.adminApprovalStatus === "approved"
                ? "default"
                : profileData.adminApprovalStatus === "pending"
                  ? "secondary"
                  : profileData.adminApprovalStatus === "rejected"
                    ? "destructive"
                    : "outline"
            }
          >
            {(profileData.adminApprovalStatus || "draft").toUpperCase()}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 
          Upload documents for admin verification and approval
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Upload Section - Blurred for now */}
        <div className="p-4 border-2 border-dashed border-gray-300  rounded-lg blur-sm pointer-events-none">
          <div className="text-center">
            <p className="text-sm text-gray-600  mb-2">
              Upload verification documents (ID, certificates, etc.)
            </p>
            <Button variant="outline" disabled={!isEditing}>
              Choose Files
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Supported formats: PDF, JPG, PNG (Max 5MB each)
            </p>
          </div>
        </div>

        {/* Admin Approval Status - Blurred for now */}
        <div className="p-4 bg-gray-50  rounded-lg blur-sm pointer-events-none">
          <h4 className="font-medium mb-2">Approval Status</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Current Status:</span>
              <Badge
                variant={
                  profileData.adminApprovalStatus === "approved"
                    ? "default"
                    : profileData.adminApprovalStatus === "pending"
                      ? "secondary"
                      : profileData.adminApprovalStatus === "rejected"
                        ? "destructive"
                        : "outline"
                }
              >
                {(profileData.adminApprovalStatus || "draft").toUpperCase()}
              </Badge>
            </div>
            {profileData.adminApprovalStatus === "rejected" && (
              <div className="mt-2 p-2 bg-red-50  border border-red-200  rounded">
                <p className="text-sm text-red-600 
                  Your profile was rejected. Please review and resubmit.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Submit Button for Draft Status */}
        {(profileData.adminApprovalStatus === "draft" ||
          !profileData.adminApprovalStatus) && (
          <div className="p-4 bg-blue-50  border border-blue-200  rounded">
            <p className="text-sm text-blue-600  mb-3">
              Complete your profile and upload verification documents to submit
              for admin approval.
            </p>
            <Button
              onClick={handleSubmitForApproval}
              className="w-full"
              disabled={!isEditing}
            >
              Submit for Approval
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This will change your status to PENDING for admin review
            </p>
          </div>
        )}

        {/* Coming Soon Notice */}
        <div className="p-4 bg-yellow-50  border border-yellow-200  rounded">
          <p className="text-sm text-yellow-700  text-center">
            🚧 This feature is under development and will be available soon! 🚧
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
