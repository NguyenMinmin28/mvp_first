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

interface DeveloperProfileTabProps {
  profileData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: string | number | boolean) => void;
}

export default function DeveloperProfileTab({
  profileData,
  isEditing,
  onInputChange,
}: DeveloperProfileTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Developer Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={profileData.bio || ""}
            onChange={(e) => onInputChange("bio", e.target.value)}
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
                onInputChange("experienceYears", parseInt(e.target.value))
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
              onValueChange={(value) => onInputChange("level", value)}
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

        <div>
          <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
          <Input
            id="linkedinUrl"
            value={profileData.linkedinUrl || ""}
            onChange={(e) => onInputChange("linkedinUrl", e.target.value)}
            disabled={!isEditing}
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div>
          <Label htmlFor="currentStatus">Current Status</Label>
          <Select
            value={profileData.currentStatus || "available"}
            onValueChange={(value) => onInputChange("currentStatus", value)}
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
      </CardContent>
    </Card>
  );
}
