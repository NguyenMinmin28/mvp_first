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
    <div className="space-y-6">
      {/* Professional Overview Card */}
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Professional Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Full Name */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Full Name
              </div>
              <div className="text-base font-semibold text-gray-900">
                {profile.name || "-"}
              </div>
            </div>

            {/* Experience */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Experience
              </div>
              <div className="text-base font-semibold text-gray-900">
                {profile.experienceYears || 0} {profile.experienceYears === 1 ? 'Year' : 'Years'}
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Hourly Rate
              </div>
              <div className="text-base font-semibold text-gray-900">
                ${profile.hourlyRate || 0}/hr
              </div>
            </div>

            {/* Hours Worked */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Hours Worked
              </div>
              <div className="text-base font-semibold text-gray-900">
                {profile.hoursWorked || 0} hrs
              </div>
            </div>

            {/* Total Earnings */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Total Earnings
              </div>
              <div className="text-base font-semibold text-gray-900">
                ${(profile.totalEarning || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            {/* Core Skills */}
            <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all md:col-span-2 lg:col-span-1">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Core Skills
              </div>
              {profile.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200"
                    >
                      {skill.skillName}
                    </span>
                  ))}
                  {profile.skills.length > 5 && (
                    <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-medium rounded border border-gray-200">
                      +{profile.skills.length - 5} more
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm text-gray-400">No skills listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Key Metrics */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base font-semibold text-gray-900">
              Key Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Experience Level</span>
                <span className="text-sm font-medium text-gray-900">
                  {profile.experienceYears && profile.experienceYears >= 10
                    ? 'Senior'
                    : profile.experienceYears && profile.experienceYears >= 5
                    ? 'Mid-level'
                    : 'Junior'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Availability</span>
                <span className="text-sm font-medium text-gray-900">Available</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Response Time</span>
                <span className="text-sm font-medium text-gray-900">Within 24h</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Summary */}
        <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50">
            <CardTitle className="text-base font-semibold text-gray-900">
              Performance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Projects Completed</span>
                <span className="text-sm font-medium text-gray-900">-</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Success Rate</span>
                <span className="text-sm font-medium text-gray-900">-</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">Average Rating</span>
                <span className="text-sm font-medium text-gray-900">-</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
