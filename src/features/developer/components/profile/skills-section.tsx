"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface SkillsSectionProps {
  skills?: Array<{ skillName: string }>;
}

export default function SkillsSection({ skills }: SkillsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Skills</CardTitle>
      </CardHeader>
      <CardContent>
        {skills && skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, idx) => (
              <span 
                key={idx} 
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium"
              >
                {skill.skillName}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No skills listed</div>
        )}
      </CardContent>
    </Card>
  );
}
