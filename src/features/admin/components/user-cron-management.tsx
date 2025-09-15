"use client";

import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Badge } from "@/ui/components/badge";
import {
  Clock,
  Play,
  Pause,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface CronJob {
  name: string;
  path: string;
  schedule: string;
  description: string;
  lastRun?: {
    status: "success" | "failed" | "running";
    timestamp: string;
    duration?: number;
    error?: string;
  };
  nextRun?: string;
  isEnabled: boolean;
}

export function UserCronManagement() {
  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    {
      name: "Expire Candidates",
      path: "/api/cron/expire-candidates",
      schedule: "Every 1 minute",
      description:
        "Automatically expire candidates after 15 minutes of inactivity",
      isEnabled: true,
    },
    {
      name: "Reconcile Subscriptions",
      path: "/api/cron/reconcile-subscriptions",
      schedule: "Every 5 minutes",
      description: "Synchronize subscription status with PayPal",
      isEnabled: true,
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchCronStatus = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch recent cron runs for each job
      const [expireRuns, reconcileRuns] = await Promise.all([
        fetch("/api/admin/cron-runs?job=expire-candidates&limit=1").then((r) =>
          r.json()
        ),
        fetch("/api/admin/cron-runs?job=reconcile-subscriptions&limit=1").then(
          (r) => r.json()
        ),
      ]);

      setCronJobs((prev) =>
        prev.map((job) => {
          let lastRun: CronJob["lastRun"];
          if (job.name === "Expire Candidates" && expireRuns.runs?.[0]) {
            const run = expireRuns.runs[0];
            const status: NonNullable<CronJob["lastRun"]>["status"] =
              run.success ? "success" : "failed";
            lastRun = {
              status,
              timestamp: String(run.startedAt),
              duration:
                typeof run.duration === "number" ? run.duration : undefined,
              error: run.details?.error as string | undefined,
            };
          } else if (
            job.name === "Reconcile Subscriptions" &&
            reconcileRuns.runs?.[0]
          ) {
            const run = reconcileRuns.runs[0];
            const status: NonNullable<CronJob["lastRun"]>["status"] =
              run.success ? "success" : "failed";
            lastRun = {
              status,
              timestamp: String(run.startedAt),
              duration:
                typeof run.duration === "number" ? run.duration : undefined,
              error: run.details?.error as string | undefined,
            };
          }

          return { ...job, lastRun };
        })
      );

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching cron status:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const runCronJob = async (jobPath: string, jobName: string) => {
    try {
      setLoading(true);

      const response = await fetch(jobPath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        // Update the job's last run status
        setCronJobs((prev) =>
          prev.map((job) =>
            job.path === jobPath
              ? {
                  ...job,
                  lastRun: {
                    status: "success" as const,
                    timestamp: new Date().toISOString(),
                    duration: 0,
                  },
                }
              : job
          )
        );
      } else {
        throw new Error(result.error || "Failed to run cron job");
      }
    } catch (error) {
      console.error(`Error running ${jobName}:`, error);
      // Update with error status
      setCronJobs((prev) =>
        prev.map((job) =>
          job.path === jobPath
            ? {
                ...job,
                lastRun: {
                  status: "failed" as const,
                  timestamp: new Date().toISOString(),
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                },
              }
            : job
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCronJob = (jobPath: string) => {
    setCronJobs((prev) =>
      prev.map((job) =>
        job.path === jobPath ? { ...job, isEnabled: !job.isEnabled } : job
      )
    );
  };

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
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Success
          </Badge>
        );
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "running":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Running
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  useEffect(() => {
    fetchCronStatus();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchCronStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchCronStatus]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Cron Job Management
          </h2>
          <p className="text-muted-foreground">
            Manage the system's automated cron jobs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCronStatus}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cronJobs.map((job: any) => (
          <Card key={job.path} className={!job.isEnabled ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(job.lastRun?.status)}
                  {job.name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {getStatusBadge(job.lastRun?.status)}
                  <Button
                    variant={job.isEnabled ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleCronJob(job.path)}
                  >
                    {job.isEnabled ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {job.description}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Schedule:</span>
                  <span>{job.schedule}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1">
                  <span className="font-medium">Path:</span>
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {job.path}
                  </code>
                </div>
              </div>

              {job.lastRun && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Last Run</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>
                        {new Date(job.lastRun.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {job.lastRun.duration !== undefined && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{job.lastRun.duration}s</span>
                      </div>
                    )}
                    {job.lastRun.error && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        <strong>Error:</strong> {job.lastRun.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => runCronJob(job.path, job.name)}
                  disabled={loading || !job.isEnabled}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cron Job Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Expire Candidates</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Runs every minute to check expired candidates</li>
                <li>
                  Automatically expires candidates after 15 minutes of no
                  response
                </li>
                <li>Updates status from "pending" to "expired"</li>
                <li>Logs expiration time for analytics</li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">Reconcile Subscriptions</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Runs every 5 minutes to synchronize with PayPal</li>
                <li>Checks subscription status and updates the database</li>
                <li>Processes webhook events from PayPal</li>
                <li>Updates user quotas and usage</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Cron Configuration</h4>
              <div className="bg-muted p-3 rounded text-xs font-mono">
                <div>
                  Expire Candidates: <code>0 */1 * * * *</code> (Every 1 minute)
                </div>
                <div>
                  Reconcile Subscriptions: <code>0 */5 * * * *</code> (Every 5
                  minutes)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
