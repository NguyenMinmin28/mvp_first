"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface EducationSectionProps {
  education?: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
}

export default function EducationSection({ education }: EducationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Education</CardTitle>
      </CardHeader>
      <CardContent>
        {education && education.length > 0 ? (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="font-semibold text-lg">{edu.degree}</div>
                <div className="text-gray-600 font-medium">{edu.institution}</div>
                <div className="text-sm text-gray-500">{edu.field}</div>
                <div className="text-sm text-gray-500">
                  {edu.startDate} - {edu.endDate || "Present"}
                </div>
                {edu.description && (
                  <div className="text-sm text-gray-700 mt-2">{edu.description}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No education records provided</div>
        )}
      </CardContent>
    </Card>
  );
}
