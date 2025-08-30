"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Pagination } from "@/ui/components/pagination";

interface UsageTransaction {
  id: string;
  clientEmail: string;
  clientName: string;
  packageName: string;
  periodStart: string;
  periodEnd: string;
  projectsPostedCount: number;
  contactClicksByProject: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function UsageTransactionsTable() {
  const [transactions, setTransactions] = useState<UsageTransaction[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchTransactions = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/admin/usage-transactions?page=${page}&limit=20&t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch usage transactions");
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions(pagination?.page || 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions, pagination?.page]);

  const handlePageChange = (page: number) => {
    fetchTransactions(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getTotalContactClicks = (contactClicksByProject: Record<string, number>) => {
    return Object.values(contactClicksByProject).reduce((sum, clicks) => sum + clicks, 0);
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
              onClick={() => fetchTransactions()} 
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
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Usage Transactions</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              <Button 
                onClick={() => fetchTransactions(pagination?.page || 1)} 
                variant="outline" 
                size="sm"
                disabled={loading}
              >
                {loading ? <LoadingSpinner size="sm" /> : "Refresh"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No usage transactions found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Client</th>
                    <th className="text-left p-2">Package</th>
                    <th className="text-left p-2">Period</th>
                    <th className="text-left p-2">Projects Posted</th>
                    <th className="text-left p-2">Contact Clicks</th>
                    <th className="text-left p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction: any) => (
                    <tr key={transaction.id} className="border-b hover:bg-muted/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{transaction.clientName || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">
                            {transaction.clientEmail}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary">{transaction.packageName}</Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm">
                          <div>{formatDate(transaction.periodStart)}</div>
                          <div className="text-muted-foreground">
                            to {formatDate(transaction.periodEnd)}
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {transaction.projectsPostedCount}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline">
                          {getTotalContactClicks(transaction.contactClicksByProject)}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="text-sm text-muted-foreground">
                          {formatDate(transaction.createdAt)}
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
