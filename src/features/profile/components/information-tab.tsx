"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Badge } from "@/ui/components/badge";
import { toast } from "sonner";
import { LoadingSpinner } from "@/ui/components/loading-spinner";

interface ProfileData {
  // User fields
  name?: string;
  email?: string;
  phoneE164?: string;

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
  usualResponseTimeMs?: number;
  currentStatus?: "available" | "checking" | "busy" | "away";
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
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile Information
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
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

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name || ""}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profileData.email || ""}
                disabled={true}
                className="bg-gray-50"
                placeholder="your@email.com"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phoneE164 || ""}
              onChange={(e) => handleInputChange("phoneE164", e.target.value)}
              disabled={!isEditing}
              placeholder="+1234567890"
            />
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Information */}
      {userRole === "CLIENT" ? (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={profileData.companyName || ""}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={profileData.location || ""}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Developer Profile</CardTitle>
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
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ""}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself and your expertise..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={profileData.experienceYears || 0}
                  onChange={(e) =>
                    handleInputChange(
                      "experienceYears",
                      parseInt(e.target.value)
                    )
                  }
                  disabled={!isEditing}
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <Label htmlFor="level">Experience Level</Label>
                <Select
                  value={profileData.level || "FRESHER"}
                  onValueChange={(value) => handleInputChange("level", value)}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FRESHER">Fresher (0-2 years)</SelectItem>
                    <SelectItem value="MID">Mid-level (3-5 years)</SelectItem>
                    <SelectItem value="EXPERT">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  value={profileData.linkedinUrl || ""}
                  onChange={(e) =>
                    handleInputChange("linkedinUrl", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
                <Input
                  id="whatsappNumber"
                  value={profileData.whatsappNumber || ""}
                  onChange={(e) =>
                    handleInputChange("whatsappNumber", e.target.value)
                  }
                  disabled={!isEditing}
                  placeholder="+1234567890"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currentStatus">Current Status</Label>
              <Select
                value={profileData.currentStatus || "available"}
                onValueChange={(value) =>
                  handleInputChange("currentStatus", value)
                }
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="away">Away</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Portfolio Links</Label>
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addArrayField("portfolioLinks")}
                  >
                    Add Link
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {(profileData.portfolioLinks || []).map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={link}
                      onChange={(e) =>
                        handleArrayFieldChange(
                          "portfolioLinks",
                          index,
                          e.target.value
                        )
                      }
                      disabled={!isEditing}
                      placeholder="https://example.com"
                    />
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          removeArrayField("portfolioLinks", index)
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
