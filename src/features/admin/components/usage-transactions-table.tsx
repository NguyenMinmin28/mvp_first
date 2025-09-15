"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { LoadingSpinner } from "@/ui/components/loading-spinner";
import { Pagination } from "@/ui/components/pagination";
import { DataTable, Column } from "@/ui/components/data-table";

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
  const DEFAULT_LIMIT = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchTransactions = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/usage-transactions?page=${page}&limit=${DEFAULT_LIMIT}&t=${Date.now()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch usage transactions");
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
      setCurrentPage(data.pagination?.page || page);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(currentPage);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTransactions(currentPage);
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTransactions, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTransactions(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalContactClicks = (
    contactClicksByProject: Record<string, number>
  ) => {
    return Object.values(contactClicksByProject).reduce(
      (sum, clicks) => sum + clicks,
      0
    );
  };

  // Stats computed from the current page of data (and overall total if provided)
  const stats = {
    totalRecords: pagination?.total ?? transactions.length,
    totalProjectsPosted: transactions.reduce(
      (sum, t) => sum + (t.projectsPostedCount || 0),
      0
    ),
    totalContactClicks: transactions.reduce(
      (sum, t) => sum + getTotalContactClicks(t.contactClicksByProject || {}),
      0
    ),
    uniqueClients: new Set(transactions.map((t) => t.clientEmail)).size,
  };

  type Row = {
    id: string;
    client: string;
    packageName: string;
    period: string;
    projectsPostedCount: number;
    contactClicks: number;
    createdAt: string;
  };

  const rows: Row[] = transactions.map((t) => ({
    id: t.id,
    client: `${t.clientName || "N/A"} | ${t.clientEmail}`,
    packageName: t.packageName,
    period: `${formatDate(t.periodStart)} → ${formatDate(t.periodEnd)}`,
    projectsPostedCount: t.projectsPostedCount,
    contactClicks: getTotalContactClicks(t.contactClicksByProject),
    createdAt: formatDate(t.createdAt),
  }));

  const columns: Column<Row>[] = [
    {
      key: "client",
      label: "Client",
      sortable: true,
      render: (_, item) => {
        const [name, email] = item.client.split(" | ");
        return (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
        );
      },
      width: "min-w-[220px]",
    },
    {
      key: "packageName",
      label: "Package",
      sortable: true,
      render: (value) => <Badge variant="secondary">{value}</Badge>,
    },
    {
      key: "period",
      label: "Period",
      sortable: true,
      width: "min-w-[220px]",
    },
    {
      key: "projectsPostedCount",
      label: "Projects Posted",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "contactClicks",
      label: "Contact Clicks",
      sortable: true,
      render: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (value) => (
        <div className="text-sm text-muted-foreground">{value}</div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border rounded-lg">
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
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <p className="text-[11px] font-medium text-blue-700/90">
              Total Records
            </p>
            <p className="text-xl font-bold text-blue-900">
              {stats.totalRecords}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-6">
            <p className="text-[11px] font-medium text-emerald-700/90">
              Projects Posted
            </p>
            <p className="text-xl font-bold text-emerald-900">
              {stats.totalProjectsPosted}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-6">
            <p className="text-[11px] font-medium text-amber-700/90">
              Contact Clicks
            </p>
            <p className="text-xl font-bold text-amber-900">
              {stats.totalContactClicks}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-6">
            <p className="text-[11px] font-medium text-purple-700/90">
              Unique Clients
            </p>
            <p className="text-xl font-bold text-purple-900">
              {stats.uniqueClients}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Header and refresh */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Usage Transactions</h2>
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

      {/* Data table */}
      <DataTable<Row>
        data={rows}
        columns={columns}
        title={undefined}
        hideSearch
        unstyled
        loading={loading}
      />

      {transactions.length === 0 && !loading && (
        <div className="text-center text-muted-foreground py-8">
          No usage transactions found
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
