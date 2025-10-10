"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";

interface IdeaSparkListProps {
  profile?: any;
  developerId?: string;
}

interface ActivityLog {
  id: string;
  status: "available" | "busy" | "checking" | "away";
  action: "login" | "logout" | "status_change" | "status_update";
  timestamp: string;
  timeAgo: string;
}

export default function IdeaSparkList({ profile, developerId }: IdeaSparkListProps = {}) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!developerId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/developer/${developerId}/activity?limit=4`);
        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities || []);
        } else {
          console.error("Failed to fetch activities");
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [developerId]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Activity</CardTitle>
      </CardHeader>
      <CardContent className="text-sm pt-0">
        {loading && (
          <div className="text-sm text-gray-600 text-center py-4">
            <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full mx-auto mb-2"></div>
            <p>Loading activities...</p>
          </div>
        )}
        
        {!loading && activities.length === 0 && (
          <div className="text-sm text-gray-600 text-center py-4">
            <div className="mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="font-medium">No recent activity</p>
            <p className="text-xs text-gray-500 mt-1">
              {profile?.currentStatus ? `Current status: ${profile.currentStatus}` : 'Activity will appear here'}
            </p>
          </div>
        )}
        
        {!loading && activities.length > 0 && (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-2 top-2 bottom-0 w-px bg-gray-200" />

            <div className="space-y-4">
              {activities.map((activity, idx) => (
                <div
                  key={`${activity.id}-${idx}`}
                  className="relative flex items-start gap-4"
                >
                  {/* Colored dot with small white dot inside */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 border-white flex-shrink-0 flex items-center justify-center relative z-10 ${
                      activity.status === "available"
                        ? "bg-green-500"
                        : activity.status === "busy"
                        ? "bg-red-500"
                        : activity.status === "checking"
                        ? "bg-yellow-500"
                        : "bg-gray-400"
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  {/* Activity content */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">
                      {activity.action === "login" && "Logged in"}
                      {activity.action === "logout" && "Logged out"}
                      {activity.action === "status_change" && `Status changed to ${activity.status}`}
                      {activity.action === "status_update" && `Status updated to ${activity.status}`}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 mt-1">
                      <svg
                        className="w-3 h-3 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs text-gray-500">
                        {activity.timeAgo}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}