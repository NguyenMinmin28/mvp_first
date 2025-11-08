"use client";

import { useEffect, useState } from "react";
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
  developerId?: string;
}

export default function WorkHistory({ workHistory: initialWorkHistory, developerId }: WorkHistoryProps) {
  const [workHistory, setWorkHistory] = useState(initialWorkHistory || []);
  const [loading, setLoading] = useState(!initialWorkHistory && !!developerId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If developerId is provided and no initial workHistory, fetch from API
    if (developerId && !initialWorkHistory) {
      const fetchWorkHistory = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch(`/api/developer/${developerId}/work-history`, {
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error("Failed to fetch work history");
          }

          const data = await response.json();
          setWorkHistory(data.workHistory || []);
        } catch (err) {
          console.error("Error fetching work history:", err);
          setError(err instanceof Error ? err.message : "Failed to load work history");
        } finally {
          setLoading(false);
        }
      };

      fetchWorkHistory();
    }
  }, [developerId, initialWorkHistory]);

  return (
    <div className="space-y-6">
      <Card className="border border-gray-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Project Work History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-gray-500">Loading work history...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          ) : workHistory && workHistory.length > 0 ? (
            <div className="space-y-4">
              {workHistory.map((work, index) => (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 mb-1">
                        {work.project}
                      </div>
                      <div className="text-sm font-medium text-gray-700">
                        {work.client}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 px-2.5 py-1 rounded whitespace-nowrap">
                      {work.startDate} - {work.endDate || "Present"}
                    </div>
                  </div>
                  {work.description && (
                    <div className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100">
                      {work.description}
                    </div>
                  )}
                  {work.technologies && work.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {work.technologies.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded border border-gray-200"
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
            <div className="text-center py-12">
              <p className="text-gray-500 font-medium">No work history provided</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
