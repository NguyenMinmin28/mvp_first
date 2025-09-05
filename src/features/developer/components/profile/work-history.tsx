"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface WorkHistoryProps {
  workHistory?: Array<{
    project: string;
    client: string;
    startDate: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
  }>;
}

export default function WorkHistory({ workHistory }: WorkHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Work History</CardTitle>
      </CardHeader>
      <CardContent>
        {workHistory && workHistory.length > 0 ? (
          <div className="space-y-4">
            {workHistory.map((work, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="font-semibold text-lg">{work.project}</div>
                <div className="text-gray-600 font-medium">{work.client}</div>
                <div className="text-sm text-gray-500">
                  {work.startDate} - {work.endDate || "Present"}
                </div>
                {work.description && (
                  <div className="text-sm text-gray-700 mt-2">{work.description}</div>
                )}
                {work.technologies && work.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {work.technologies.map((tech, techIndex) => (
                      <span 
                        key={techIndex}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No work history provided</div>
        )}
      </CardContent>
    </Card>
  );
}
