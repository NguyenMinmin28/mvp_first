"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface EmploymentHistoryProps {
  employmentHistory?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
}

export default function EmploymentHistory({ employmentHistory }: EmploymentHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Employment History</CardTitle>
      </CardHeader>
      <CardContent>
        {employmentHistory && employmentHistory.length > 0 ? (
          <div className="space-y-4">
            {employmentHistory.map((job, index) => (
              <div key={index} className="border-l-4 border-gray-200 pl-4">
                <div className="font-semibold text-lg">{job.position}</div>
                <div className="text-gray-600 font-medium">{job.company}</div>
                <div className="text-sm text-gray-500">
                  {job.startDate} - {job.endDate || "Present"}
                </div>
                {job.description && (
                  <div className="text-sm text-gray-700 mt-2">{job.description}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No employment history provided</div>
        )}
      </CardContent>
    </Card>
  );
}
