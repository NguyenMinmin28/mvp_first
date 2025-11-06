"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
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
import AvatarUpload from "../avatar-upload";

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
            <Input
              id="name"
              value={profileData.name || ""}
              onChange={(e) => onInputChange("name", e.target.value)}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phoneE164 || ""}
              onChange={(e) => onInputChange("phoneE164", e.target.value)}
              disabled={!isEditing}
              placeholder="+1234567890"
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={profileData.location || ""}
              onChange={(e) => onInputChange("location", e.target.value)}
              disabled={!isEditing}
              placeholder="City, Country"
            />
          </div>
        </div>

        {/* Client-specific fields */}
        {userRole === "CLIENT" && (
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={profileData.companyName || ""}
              onChange={(e) => onInputChange("companyName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter your company name"
            />
          </div>
        )}

        {/* Developer-specific fields */}
        {userRole === "DEVELOPER" && (
          <>
            <div>
              <Label htmlFor="bio">Bio / About Me</Label>
              <Textarea
                id="bio"
                value={profileData.bio || ""}
                onChange={(e) => onInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Tell us about yourself, your experience, and what makes you unique..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={profileData.age || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                    onInputChange("age", value || 0);
                  }}
                  disabled={!isEditing}
                  placeholder="Age"
                  min={18}
                  max={100}
                />
              </div>
              <div>
                <Label htmlFor="experienceYears">Years of Experience</Label>
                <Input
                  id="experienceYears"
                  type="number"
                  value={profileData.experienceYears || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseInt(e.target.value, 10);
                    onInputChange("experienceYears", value || 0);
                  }}
                  disabled={!isEditing}
                  placeholder="Years of experience"
                  min={0}
                  max={50}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Experience Level</Label>
                <Select
                  value={profileData.level || "FRESHER"}
                  onValueChange={(value) => onInputChange("level", value)}
                  disabled={!isEditing}
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
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={profileData.hourlyRate || profileData.hourlyRateUsd || ""}
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseFloat(e.target.value);
                    onInputChange("hourlyRateUsd", value || 0);
                  }}
                  disabled={!isEditing}
                  placeholder="Hourly rate in USD"
                  min={0}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
              <Input
                id="linkedinUrl"
                type="url"
                value={profileData.linkedinUrl || ""}
                onChange={(e) => onInputChange("linkedinUrl", e.target.value)}
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
          </>
        )}

        {/* Account Information Section */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={profileData.role || ""}
                disabled={true}
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label htmlFor="createdAt">Member Since</Label>
              <Input
                id="createdAt"
                value={
                  profileData.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString()
                    : ""
                }
                disabled={true}
                className="bg-gray-50"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
