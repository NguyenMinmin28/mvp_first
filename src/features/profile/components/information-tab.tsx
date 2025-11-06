"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { toast } from "sonner";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/components/tabs";
import {
  BasicInfoTab,
  CompanyInfoTab,
  PortfolioTab,
  WhatsAppTab,
  VerificationTab,
  DeveloperProfileTab,
  SecurityTab,
} from "./tabs";

interface ProfileData {
  // User fields
  name?: string;
  email?: string;
  phoneE164?: string;
  hasPassword?: boolean;

  // Client Profile fields
  companyName?: string;
  location?: string;

  // Developer Profile fields
  photoUrl?: string;
  bio?: string;
  experienceYears?: number;
  level?: "FRESHER" | "MID" | "EXPERT";
  linkedinUrl?: string;
  portfolioLinks?: string[];
  whatsappNumber?: string;
  whatsappVerified?: boolean;
  usualResponseTimeMs?: number;
  currentStatus?: "available" | "not_available" | "online" | "offline";
  adminApprovalStatus?: "draft" | "pending" | "approved" | "rejected";
  skills?: Array<{
    skillId: string;
    skillName: string;
    years: number;
    rating: number;
  }>;

  // Index signature for dynamic field access
  [key: string]:
    | string
    | number
    | string[]
    | boolean
    | Date
    | Array<{
        skillId: string;
        skillName: string;
        years: number;
        rating: number;
      }>
    | undefined;
}

interface InformationTabProps {
  userRole: "CLIENT" | "DEVELOPER" | undefined;
}

export default function InformationTab({ userRole }: InformationTabProps) {
  const { update: updateSession } = useSession();
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("basic");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoadingData(true);
      const response = await fetch("/api/user/me");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data.user || {});
        console.log(data);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean | string[]
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayFieldChange = (
    field: string,
    index: number,
    value: string
  ) => {
    setProfileData((prev) => ({
      ...prev,
      [field]:
        (prev[field] as string[])?.map((item, i) =>
          i === index ? value : item
        ) || [],
    }));
  };

  const addArrayField = (field: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: [...((prev[field] as string[]) || []), ""],
    }));
  };

  const removeArrayField = (field: string, index: number) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: (prev[field] as string[])?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
        setIsEditing(false);
        await updateSession();
        // Dispatch event to update header avatar
        window.dispatchEvent(new CustomEvent('profile-updated'));
      } else {
        throw new Error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    loadProfileData(); // Reset to original data
  };

  const handleSaveAvatar = async (photoUrl: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl }),
      });

      if (response.ok) {
        toast.success("Avatar updated successfully");
        // Update local state
        setProfileData((prev) => ({
          ...prev,
          photoUrl,
        }));
        await updateSession();
        // Dispatch event to update header avatar
        window.dispatchEvent(new CustomEvent('profile-updated'));
      } else {
        throw new Error("Failed to update avatar");
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar");
      throw error; // Re-throw so AvatarUpload can handle it
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppVerification = async () => {
    if (!profileData.whatsappNumber) {
      toast.error("Please enter a WhatsApp number first");
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/auth/wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: profileData.whatsappNumber }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          if (result.development && result.demoCode) {
            toast.success(
              `Verification code sent! (Dev mode: ${result.demoCode})`
            );
          } else {
            toast.success("WhatsApp verification code sent!");
          }
          setShowOtpInput(true);
          setOtpCode("");
        } else {
          setShowOtpInput(false); // Don't show OTP input if there's an error
          setOtpCode(""); // Clear OTP code
          throw new Error(result.error || "Failed to send verification code");
        }
      } else {
        const errorData = await response.json();
        setShowOtpInput(false); // Don't show OTP input if there's an error
        setOtpCode(""); // Clear OTP code
        throw new Error(errorData.error || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Error sending WhatsApp verification:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send verification code"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatsAppConfirm = async (otp: string) => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    try {
      setIsVerifyingOtp(true);
      const response = await fetch("/api/auth/wa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: profileData.whatsappNumber,
          verificationCode: otp,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update database with verification status
          try {
            const updateResponse = await fetch("/api/user/update-whatsapp", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                whatsappVerified: true,
                whatsappNumber: profileData.whatsappNumber,
              }),
            });

            if (updateResponse.ok) {
              toast.success("WhatsApp number verified successfully!");
              setProfileData((prev) => ({
                ...prev,
                whatsappVerified: true,
              }));
              setShowOtpInput(false);
              setOtpCode("");
              await updateSession();
            } else {
              throw new Error("Failed to update verification status");
            }
          } catch (updateError) {
            console.error("Error updating verification status:", updateError);
            toast.error("Verification successful but failed to update profile");
          }
        } else {
          throw new Error(result.error || "Invalid verification code");
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Invalid verification code");
      }
    } catch (error) {
      console.error("Error verifying WhatsApp:", error);
      toast.error(
        error instanceof Error ? error.message : "Invalid verification code"
      );
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleOtpCodeChange = (value: string) => {
    setOtpCode(value);
  };

  const handleCancelOtp = () => {
    setShowOtpInput(false);
    setOtpCode("");
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Profile Information
          </h2>
          <p className="text-gray-600 mt-1">
            Manage your personal and professional information
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? <LoadingSpinner size="sm" /> : "Save Changes"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full flex-wrap gap-2">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          {userRole === "DEVELOPER" && (
            <>
              <TabsTrigger value="developer">Developer</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
            </>
          )}
          {userRole === "CLIENT" && (
            <TabsTrigger value="company">Company</TabsTrigger>
          )}
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-6">
          <BasicInfoTab
            profileData={profileData}
            isEditing={isEditing}
            onInputChange={handleInputChange}
            onSaveAvatar={handleSaveAvatar}
            userRole={userRole}
          />

          {/* Developer section moved to its own tab to avoid duplication */}
        </TabsContent>

        {/* Company Information Tab (Client only) */}
        {userRole === "CLIENT" && (
          <TabsContent value="company" className="space-y-6">
            <CompanyInfoTab
              profileData={profileData}
              isEditing={isEditing}
              onInputChange={handleInputChange}
            />
          </TabsContent>
        )}

        {/* Developer Profile Tabs */}
        {userRole === "DEVELOPER" && (
          <>
            {/* Developer Basic Profile Tab */}
            <TabsContent value="developer" className="space-y-6">
              <DeveloperProfileTab
                profileData={profileData}
                isEditing={isEditing}
                onInputChange={handleInputChange}
              />
            </TabsContent>
            {/* Portfolio Links Tab */}
            <TabsContent value="portfolio" className="space-y-6">
              <PortfolioTab
                profileData={profileData}
                isEditing={isEditing}
                onArrayFieldChange={handleArrayFieldChange}
                onAddArrayField={addArrayField}
                onRemoveArrayField={removeArrayField}
              />
            </TabsContent>

            {/* WhatsApp Tab */}
            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppTab
                profileData={profileData}
                isEditing={isEditing}
                isLoading={isLoading}
                showOtpInput={showOtpInput}
                otpCode={otpCode}
                isVerifyingOtp={isVerifyingOtp}
                onInputChange={handleInputChange}
                onOtpCodeChange={handleOtpCodeChange}
                onWhatsAppVerification={handleWhatsAppVerification}
                onWhatsAppConfirm={handleWhatsAppConfirm}
                onCancelOtp={handleCancelOtp}
              />
            </TabsContent>

            {/* Verification Documents Tab */}
            <TabsContent value="verification" className="space-y-6">
              <VerificationTab
                profileData={profileData}
                isEditing={isEditing}
              />
            </TabsContent>
          </>
        )}

        {/* Security Tab - Available for all users */}
        <TabsContent value="security" className="space-y-6">
          <SecurityTab
            hasPassword={profileData.hasPassword || false}
            email={profileData.email}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
