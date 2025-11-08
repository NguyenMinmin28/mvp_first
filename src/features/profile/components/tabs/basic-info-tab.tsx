"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Textarea } from "@/ui/components/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/components/select";
import AvatarUpload from "../avatar-upload";
import { ReadOnlyField } from "../read-only-field";

interface BasicInfoTabProps {
  profileData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onSaveAvatar?: (photoUrl: string) => Promise<void>;
  userRole?: "CLIENT" | "DEVELOPER" | undefined;
}

export default function BasicInfoTab({
  profileData,
  isEditing,
  onInputChange,
  onSaveAvatar,
  userRole,
}: BasicInfoTabProps) {
  const experienceLevelLabels: Record<string, string> = {
    FRESHER: "Fresher",
    MID: "Mid-level",
    EXPERT: "Expert",
  };

  const hourlyRateValue =
    typeof profileData.hourlyRate === "number"
      ? profileData.hourlyRate
      : typeof profileData.hourlyRateUsd === "number"
        ? profileData.hourlyRateUsd
        : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Avatar Upload Section */}
        <AvatarUpload
          value={profileData.photoUrl || profileData.image || ""}
          onChange={(value) => onInputChange("photoUrl", value)}
          disabled={!isEditing}
          name={profileData.name}
          size="md"
          onSave={onSaveAvatar}
          allowDirectUpload={true}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={profileData.name || ""}
                onChange={(e) => onInputChange("name", e.target.value)}
                placeholder="Enter your full name"
              />
            ) : (
              <ReadOnlyField value={profileData.name} />
            )}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <ReadOnlyField value={profileData.email} />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            {isEditing ? (
              <Input
                id="phone"
                value={profileData.phoneE164 || ""}
                onChange={(e) => onInputChange("phoneE164", e.target.value)}
                placeholder="+1234567890"
              />
            ) : (
              <ReadOnlyField value={profileData.phoneE164} />
            )}
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            {isEditing ? (
              <Input
                id="location"
                value={profileData.location || ""}
                onChange={(e) => onInputChange("location", e.target.value)}
                placeholder="City, Country"
              />
            ) : (
              <ReadOnlyField value={profileData.location} />
            )}
          </div>
        </div>

        {/* Client-specific fields */}
        {userRole === "CLIENT" && (
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            {isEditing ? (
              <Input
                id="companyName"
                value={profileData.companyName || ""}
                onChange={(e) => onInputChange("companyName", e.target.value)}
                placeholder="Enter your company name"
              />
            ) : (
              <ReadOnlyField value={profileData.companyName} />
            )}
          </div>
        )}

        {/* Developer-specific fields */}
        {userRole === "DEVELOPER" && (
          <>
            <div>
              <Label htmlFor="bio">Bio / About Me</Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={profileData.bio || ""}
                  onChange={(e) => onInputChange("bio", e.target.value)}
                  placeholder="Tell us about yourself, your experience, and what makes you unique..."
                  rows={4}
                />
              ) : (
                <ReadOnlyField value={profileData.bio} multiline />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                {isEditing ? (
                  <Input
                    id="age"
                    type="number"
                    value={profileData.age ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      onInputChange("age", raw === "" ? "" : parseInt(raw, 10));
                    }}
                    placeholder="Age"
                    min={18}
                    max={100}
                  />
                ) : (
                  <ReadOnlyField value={profileData.age} />
                )}
              </div>
              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                {isEditing ? (
                  <Input
                    id="experienceYears"
                    type="number"
                    value={profileData.experienceYears ?? ""}
                    onChange={(e) => {
                      const raw = e.target.value;
                      onInputChange(
                        "experienceYears",
                        raw === "" ? "" : parseInt(raw, 10)
                      );
                    }}
                    placeholder="Years of experience"
                    min={0}
                    max={50}
                  />
                ) : (
                  <ReadOnlyField value={profileData.experienceYears} />
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Experience Level</Label>
                {isEditing ? (
                  <Select
                    value={profileData.level || "FRESHER"}
                    onValueChange={(value) => onInputChange("level", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FRESHER">Fresher</SelectItem>
                      <SelectItem value="MID">Mid-level</SelectItem>
                      <SelectItem value="EXPERT">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <ReadOnlyField
                    value={experienceLevelLabels[profileData.level as string] || profileData.level}
                  />
                )}
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                {isEditing ? (
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={
                      profileData.hourlyRate ??
                      profileData.hourlyRateUsd ??
                      ""
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      onInputChange(
                        "hourlyRateUsd",
                        raw === "" ? "" : parseFloat(raw)
                      );
                    }}
                    placeholder="Hourly rate in USD"
                    min={0}
                  />
                ) : (
                  <ReadOnlyField
                    value={
                      hourlyRateValue === 0 || hourlyRateValue
                        ? `$${hourlyRateValue}`
                        : undefined
                    }
                  />
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              {isEditing ? (
                <Input
                  id="linkedinUrl"
                  type="url"
                  value={profileData.linkedinUrl || ""}
                  onChange={(e) => onInputChange("linkedinUrl", e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              ) : (
                <ReadOnlyField value={profileData.linkedinUrl} />
              )}
            </div>
          </>
        )}

        {/* Account Information Section */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <ReadOnlyField value={profileData.role} />
            </div>
            <div>
              <Label htmlFor="createdAt">Member Since</Label>
              <ReadOnlyField
                value={
                  profileData.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString()
                    : undefined
                }
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
