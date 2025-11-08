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
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Education & Qualifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {education && education.length > 0 ? (
            <div className="space-y-4">
              {education.map((edu, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 mb-1">
                        {edu.degree}
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-1">
                        {edu.institution}
                      </div>
                      <div className="text-sm text-gray-600">{edu.field}</div>
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 px-2.5 py-1 rounded whitespace-nowrap">
                      {edu.startDate} - {edu.endDate || "Present"}
                    </div>
                  </div>
                  {edu.description && (
                    <div className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100">
                      {edu.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No education records provided</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
