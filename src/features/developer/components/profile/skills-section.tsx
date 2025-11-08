"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface SkillsSectionProps {
  skills?: Array<{ skillName: string }>;
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Technical Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {skills && skills.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {skill.skillName}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No skills listed</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
