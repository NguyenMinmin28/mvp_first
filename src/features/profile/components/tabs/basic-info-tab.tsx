"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import AvatarUpload from "../avatar-upload";

interface BasicInfoTabProps {
  profileData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
}

export default function BasicInfoTab({
  profileData,
  isEditing,
  onInputChange,
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
      </CardContent>
    </Card>
  );
}
