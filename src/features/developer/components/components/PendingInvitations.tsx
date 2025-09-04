"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Clock, Building2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { InvitationCandidate } from "./types";
import { computeTimeRemaining } from "./utils";

interface PendingInvitationsProps {
  items: InvitationCandidate[];
  now: Date;
  isProcessing: (id: string) => boolean;
  onRespond: (id: string, action: "accept" | "reject") => void;
}

export default function PendingInvitations({ items, now, isProcessing, onRespond }: PendingInvitationsProps) {
  if (items.length === 0) return null;

  const earliestDeadline = items.reduce((earliest: string | null, invitation) => {
    const invitationDeadline = new Date(invitation.acceptanceDeadline).getTime();
    const earliestTime = earliest ? new Date(earliest).getTime() : Infinity;
    return invitationDeadline < earliestTime ? invitation.acceptanceDeadline : earliest;
  }, null);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Pending Invitations ({items.length})
        </CardTitle>
        {earliestDeadline && (() => {
          const t = computeTimeRemaining(now, earliestDeadline);
          return (
            <div className="mt-2 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className={`text-sm font-medium ${t.color}`}>Earliest deadline: {t.text}</span>
              {t.urgent && (
                <span className="text-xs text-red-600 font-semibold animate-pulse">⚠️ URGENT - Respond quickly!</span>
              )}
            </div>
          );
        })()}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((invitation) => {
          const timeRemaining = computeTimeRemaining(now, invitation.acceptanceDeadline);
          const working = isProcessing(invitation.id);
          const levelColors = {
            EXPERT: "bg-purple-100 text-purple-800",
            MID: "bg-blue-100 text-blue-800",
            FRESHER: "bg-green-100 text-green-800",
          } as const;

          return (
            <Card key={invitation.id} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{invitation.batch.project.title}</h3>
                        <Badge className={(levelColors as any)[invitation.level] || levelColors.MID}>{invitation.level}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{invitation.batch.project.client.user.name}</span>
                        {invitation.batch.project.client.companyName && (
                          <span>• {invitation.batch.project.client.companyName}</span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`font-mono text-lg font-bold ${timeRemaining.color} ${timeRemaining.urgent ? 'animate-pulse' : ''}`}>{timeRemaining.text}</div>
                      <div className="text-xs text-gray-500">{timeRemaining.urgent ? '⚠️ URGENT' : 'remaining'}</div>
                      {timeRemaining.urgent && (
                        <div className="text-xs text-red-600 font-semibold mt-1">⏰ Respond quickly!</div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 line-clamp-3">{invitation.batch.project.description}</p>

                  {invitation.skills && invitation.skills.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-600">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {invitation.skills.map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{skill.name}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 border-t pt-3">
                    <div className="flex justify-between">
                      <span>Assigned: {new Date(invitation.assignedAt).toLocaleString()}</span>
                      <span>Expires: {new Date(invitation.acceptanceDeadline).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => onRespond(invitation.id, "accept")} disabled={working || timeRemaining.text === "Expired"} className="flex-1 bg-green-600 hover:bg-green-700">
                      {working ? <LoadingSpinner size="sm" className="mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Accept
                    </Button>
                    <Button variant="outline" onClick={() => onRespond(invitation.id, "reject")} disabled={working || timeRemaining.text === "Expired"} className="flex-1 border-red-300 text-red-600 hover:bg-red-50">
                      {working ? <LoadingSpinner size="sm" className="mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Reject
                    </Button>
                  </div>

                  {timeRemaining.urgent && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                      <AlertTriangle className="h-4 w-4" />
                      <span>⚠️ Urgent: Less than 5 minutes remaining!</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}


