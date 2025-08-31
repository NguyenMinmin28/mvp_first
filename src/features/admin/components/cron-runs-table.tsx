"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Pagination } from "@/ui/components/pagination";

interface CronRun {
  id: string;
  job: string;
  status: string;
  success: boolean;
  startedAt: string;
  finishedAt: string | null;
  duration: number | null;
  details: any;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function CronRunsTable() {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextCronTime, setNextCronTime] = useState<Date | null>(null);
  const [timeUntilNextCron, setTimeUntilNextCron] = useState<string>("");
  const [isCronRunning, setIsCronRunning] = useState(false);

  const fetchRuns = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/cron-runs?page=${page}&limit=20&t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch cron runs");
      }
      
      const data = await response.json();
      setRuns(data.runs);
      setPagination(data.pagination);
      setLastUpdated(new Date());
      
      // Check if any reconciliation job is currently running
      const runningJob = data.runs.find((run: CronRun) => 
        run.job === "reconcile-subscriptions" && run.status === "started"
      );
      setIsCronRunning(!!runningJob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate next cron run time (every 5 minutes)
  const calculateNextCronTime = useCallback(() => {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    
    // Find next 5-minute interval
    const nextMinute = Math.ceil(minutes / 5) * 5;
    const nextCron = new Date(now);
    nextCron.setMinutes(nextMinute, 0, 0);
    
    // If we're past the current 5-minute mark, go to next interval
    if (nextCron <= now) {
      nextCron.setMinutes(nextCron.getMinutes() + 5);
    }
    
    return nextCron;
  }, []);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      const next = calculateNextCronTime();
      setNextCronTime(next);
      
      const now = new Date();
      const diff = next.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilNextCron("Running now...");
        return;
      }
      
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeUntilNextCron(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [calculateNextCronTime]);

  useEffect(() => {
    fetchRuns();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchRuns(pagination?.page || 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchRuns, pagination?.page]);

  const handlePageChange = (page: number) => {
    fetchRuns(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "Running...";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusBadge = (status: string, success: boolean) => {
    if (status === "started") {
      return <Badge variant="secondary">Running</Badge>;
    }
    if (status === "succeeded" && success) {
      return <Badge variant="default">Success</Badge>;
    }
    if (status === "failed" || !success) {
      return <Badge variant="destructive">Failed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p>Error: {error}</p>
            <Button 
              onClick={() => fetchRuns()} 
              className="mt-2"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cron Schedule Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cron Schedule Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium">Reconciliation Job</p>
              <p className="text-muted-foreground">PayPal subscription sync</p>
              <p className="text-xs font-mono bg-muted p-1 rounded mt-1">
                */5 * * * * (every 5 minutes)
              </p>
            </div>
            <div>
              <p className="font-medium">Next Run</p>
              <p className="text-muted-foreground">Countdown timer</p>
              <div className="flex items-center gap-2">
                <p className="text-lg font-mono font-bold text-primary">
                  {isCronRunning ? "Running..." : timeUntilNextCron}
                </p>
                {isCronRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>
            <div>
              <p className="font-medium">Last Run</p>
              <p className="text-muted-foreground">Most recent execution</p>
              <p className="text-xs">
                {runs.length > 0 ? formatDate(runs[0].startedAt) : "No runs yet"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cron Job Runs</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">Next Reconciliation:</span>
                <Badge 
                  variant={isCronRunning ? "default" : "outline"} 
                  className="font-mono"
                >
                  {isCronRunning ? "Running..." : timeUntilNextCron}
                </Badge>
                {isCronRunning && (
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                )}
                {nextCronTime && !isCronRunning && (
                  <span className="text-xs">
                    ({nextCronTime.toLocaleTimeString()})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                <Button 
                  onClick={() => fetchRuns(pagination?.page || 1)} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                >
                  {loading ? <LoadingSpinner size="sm" /> : "Refresh"}
                </Button>
                <Button 
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/cron/reconcile-subscriptions?test=true', {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'test-secret'}`
                        }
                      });
                      const result = await response.json();
                      if (result.success) {
                        alert(`Reconciliation completed successfully!\nProcessed: ${result.data.processed}\nUpdated: ${result.data.updated}\nErrors: ${result.data.errors}`);
                        fetchRuns(pagination?.page || 1); // Refresh the list
                      } else {
                        alert(`Reconciliation failed: ${result.error}`);
                      }
                    } catch (error) {
                      alert(`Error running reconciliation: ${error}`);
                    }
                  }}
                  variant="default" 
                  size="sm"
                >
                  Test Now
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {runs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No cron runs found
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border-4 border-gray-300 shadow-lg">
              <table className="w-full border-collapse">
                <thead className="bg-gray-100 border-b-4 border-gray-400">
                  <tr>
                    <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Job</th>
                    <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Status</th>
                    <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Started</th>
                    <th className="text-left p-3 font-bold text-gray-800 border-r-2 border-gray-400">Duration</th>
                    <th className="text-left p-3 font-bold text-gray-800">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run: any) => (
                    <tr key={run.id} className="border-b-2 border-gray-300 hover:bg-gray-100">
                      <td className="p-3 border-r-2 border-gray-300">
                        <div className="font-medium">{run.job}</div>
                      </td>
                      <td className="p-3 border-r-2 border-gray-300">
                        {getStatusBadge(run.status, run.success)}
                      </td>
                      <td className="p-3 border-r-2 border-gray-300">
                        <div className="text-sm">
                          {formatDate(run.startedAt)}
                        </div>
                      </td>
                      <td className="p-3 border-r-2 border-gray-300">
                        <div className="text-sm">
                          {formatDuration(run.duration)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-muted-foreground max-w-xs">
                          {run.details ? (
                            <details className="cursor-pointer">
                              <summary className="hover:text-foreground">
                                {run.status === "failed" ? "View Error Details" : "View Details"}
                              </summary>
                              <div className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-48">
                                {run.status === "failed" && run.details.error ? (
                                  <div className="space-y-2">
                                    <div className="font-semibold text-red-600">Error:</div>
                                    <div className="text-red-500 whitespace-pre-wrap">{run.details.error}</div>
                                    {run.details.stack && (
                                      <>
                                        <div className="font-semibold">Stack Trace:</div>
                                        <pre className="text-xs overflow-auto">{run.details.stack}</pre>
                                      </>
                                    )}
                                    {Object.keys(run.details).length > 1 && (
                                      <>
                                        <div className="font-semibold">Full Details:</div>
                                        <pre className="text-xs overflow-auto">{JSON.stringify(run.details, null, 2)}</pre>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <pre className="text-xs overflow-auto">{JSON.stringify(run.details, null, 2)}</pre>
                                )}
                              </div>
                            </details>
                          ) : (
                            "No details"
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
