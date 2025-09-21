"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/ui/components/dialog";
import {
  Clock,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Users,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface SmartExpireCronJob {
  name: string;
  path: string;
  schedule: string;
  description: string;
  lastRun?: {
    status: "success" | "failed" | "running";
    timestamp: string;
    duration?: number;
    error?: string;
    expiredCount?: number;
    refreshedBatches?: number;
  };
  nextRun?: string;
  isEnabled: boolean;
}

interface CronRun {
  id: string;
  job: string;
  status: string;
  success: boolean;
  startedAt: string;
  finishedAt?: string;
  duration?: number;
  details?: any;
}

export function SmartExpireCronMonitor() {
  const [cronJob, setCronJob] = useState<SmartExpireCronJob>({
    name: "Smart Expire & Refresh",
    path: "/api/cron/expire-candidates",
    schedule: "Every 1 minute",
    description: "Expire candidates after 15 minutes AND auto-refresh batches when all candidates expire",
    isEnabled: true,
  });
  const [cronRuns, setCronRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedRun, setSelectedRun] = useState<CronRun | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchCronStatus = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch recent cron runs for smart expire job
      const response = await fetch("/api/admin/cron-runs?job=expire-candidates&limit=10");
      const data = await response.json();

      if (data.runs) {
        setCronRuns(data.runs);
        
        if (data.runs[0]) {
          const run = data.runs[0];
          const status: NonNullable<SmartExpireCronJob["lastRun"]>["status"] =
            run.success ? "success" : "failed";
          
          setCronJob(prev => ({
            ...prev,
            lastRun: {
              status,
              timestamp: String(run.startedAt),
              duration: typeof run.duration === "number" ? run.duration : undefined,
              error: run.details?.error as string | undefined,
              expiredCount: run.details?.expiredCount,
              refreshedBatches: run.details?.refreshedBatches,
            }
          }));
        }
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch cron status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runCronJob = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cron/expire-candidates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || "test-secret"}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh status after running
        await fetchCronStatus();
      } else {
        console.error("Cron job failed:", result.error);
      }
    } catch (error) {
      console.error("Failed to run cron job:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCronStatus();
    const interval = setInterval(fetchCronStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [fetchCronStatus]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Running</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Smart Expire & Refresh Cron
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCronStatus}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={runCronJob}
              disabled={loading}
            >
              <Play className="h-4 w-4" />
              Run Now
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-1">Job Name</h4>
            <p className="text-sm">{cronJob.name}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-gray-600 mb-1">Schedule</h4>
            <p className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {cronJob.schedule}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-1">Description</h4>
          <p className="text-sm text-gray-700">{cronJob.description}</p>
        </div>

        {/* Last Run Status */}
        {cronJob.lastRun && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm text-gray-600">Last Run</h4>
              {getStatusBadge(cronJob.lastRun.status)}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Time:</span>
                <p className="font-mono text-xs">
                  {new Date(cronJob.lastRun.timestamp).toLocaleString()}
                </p>
              </div>
              
              {cronJob.lastRun.duration && (
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <p>{cronJob.lastRun.duration}ms</p>
                </div>
              )}

              <div className="flex items-center gap-1">
                {getStatusIcon(cronJob.lastRun.status)}
                <span className="text-gray-600">Status</span>
              </div>
            </div>

            {/* Results */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {cronJob.lastRun.expiredCount !== undefined && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    <span className="font-medium">{cronJob.lastRun.expiredCount}</span> candidates expired
                  </span>
                </div>
              )}
              
              {cronJob.lastRun.refreshedBatches !== undefined && (
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    <span className="font-medium">{cronJob.lastRun.refreshedBatches}</span> batches refreshed
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {cronJob.lastRun.error && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Error:</strong> {cronJob.lastRun.error}
              </div>
            )}
          </div>
        )}

        {/* Cron Runs Table */}
        <div className="border rounded-lg">
          <div className="p-4 border-b bg-gray-50">
            <h4 className="font-medium text-sm text-gray-600">Recent Cron Runs</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Results</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {cronRuns.map((run) => (
                  <tr key={run.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      {run.success ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>
                      ) : (
                        <Badge variant="destructive">Failed</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {run.duration ? `${run.duration}s` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2 text-xs">
                        {run.details?.expiredCount !== undefined && (
                          <span className="text-orange-600">
                            {run.details.expiredCount} expired
                          </span>
                        )}
                        {run.details?.refreshedBatches !== undefined && (
                          <span className="text-blue-600">
                            {run.details.refreshedBatches} refreshed
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedRun(run);
                          setDetailsOpen(true);
                        }}
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-center">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </CardContent>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cron Run Details</DialogTitle>
          </DialogHeader>
          {selectedRun && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Status</h4>
                  <p>{selectedRun.success ? "Success" : "Failed"}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Duration</h4>
                  <p>{selectedRun.duration ? `${selectedRun.duration}s` : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Started</h4>
                  <p className="font-mono text-xs">{new Date(selectedRun.startedAt).toLocaleString()}</p>
                </div>
                <div>
                  <h4 className="font-medium text-sm text-gray-600">Finished</h4>
                  <p className="font-mono text-xs">
                    {selectedRun.finishedAt ? new Date(selectedRun.finishedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>

              {selectedRun.details && (
                <div>
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Execution Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedRun.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
