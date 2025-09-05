"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface BasicDetailsProps {
  profile: {
    name?: string;
    experienceYears?: number;
    hourlyRate?: number;
    hoursWorked?: number;
    totalEarning?: number;
    skills?: Array<{ skillName: string }>;
  };
}

export default function BasicDetails({ profile }: BasicDetailsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Basic Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24">Name:</span>
              <span className="font-bold text-black">{profile.name || "-"}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24">Experience:</span>
              <span className="font-bold text-black">{profile.experienceYears || 0} yrs</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24 whitespace-nowrap">Hourly rate:</span>
              <span className="font-bold text-black">${profile.hourlyRate || 0}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24 whitespace-nowrap">Hours worked:</span>
              <span className="font-bold text-black">{profile.hoursWorked || 0}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 w-24 whitespace-nowrap">Total Earning:</span>
              <span className="font-bold text-black">${profile.totalEarning || 0}.00</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-gray-500 w-24">Skills:</span>
              <div className="font-bold text-black flex-1">
                {profile.skills && profile.skills.length > 0 ? (
                  <span>{profile.skills.map(s => s.skillName).join(", ")}</span>
                ) : (
                  <span>-</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
