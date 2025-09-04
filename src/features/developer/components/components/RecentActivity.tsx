"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Trophy, Calendar } from "lucide-react";
import { InvitationCandidate } from "./types";
import { getLevelBadge, getStatusIcon, formatDate } from "./utils";

interface RecentActivityProps {
  items: InvitationCandidate[];
}

export default function RecentActivity({ items }: RecentActivityProps) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Activity ({items.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 5).map((invitation) => (
          <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon(invitation.responseStatus)}
              <div>
                <h4 className="font-medium">{invitation.batch.project.title}</h4>
                <p className="text-sm text-gray-600">{invitation.batch.project.client.user.name}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                {getLevelBadge(invitation.level)}
                {invitation.isFirstAccepted && (
                  <Trophy className="h-4 w-4 text-yellow-500" aria-label="Won Assignment" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">{invitation.respondedAt ? formatDate(invitation.respondedAt) : 'No response'}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}


