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
            {profileData.adminApprovalStatus?.toUpperCase() || "DRAFT"}
          </Badge>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Upload documents for admin verification and approval
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Upload Section */}
        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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

        {/* Admin Approval Status */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
                {profileData.adminApprovalStatus?.toUpperCase() || "DRAFT"}
              </Badge>
            </div>
            {profileData.adminApprovalStatus === "rejected" && (
              <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <p className="text-sm text-red-600 dark:text-red-400">
                  Your profile was rejected. Please review and resubmit.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Profile Completion Notice */}
        {profileData.adminApprovalStatus === "draft" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Complete your profile and upload verification documents to submit
              for admin approval.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
