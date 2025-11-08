"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { ReadOnlyField } from "../read-only-field";

interface CompanyInfoTabProps {
  profileData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
}

export default function CompanyInfoTab({
  profileData,
  isEditing,
  onInputChange,
}: CompanyInfoTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            {isEditing ? (
              <Input
                id="companyName"
                value={profileData.companyName || ""}
                onChange={(e) => onInputChange("companyName", e.target.value)}
                placeholder="Enter company name"
              />
            ) : (
              <ReadOnlyField value={profileData.companyName} />
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
      </CardContent>
    </Card>
  );
}
