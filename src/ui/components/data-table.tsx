"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/ui/components/select";
import { Badge } from "@/ui/components/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ChevronDown, ChevronUp, Search, Filter, Download } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title?: string;
  searchPlaceholder?: string;
  onRowClick?: (item: T) => void;
  actions?: React.ReactNode;
  className?: string;
  loading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  onRowClick,
  actions,
  className = "",
  loading = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Filter data
  const filteredData = useMemo(() => {
    const result = data.filter((item) => {
      // Global search
      if (searchTerm) {
        const searchableFields = columns
          .filter((col) => col.filterable !== false)
          .map((col) => String(item[col.key] || ""));

        if (
          !searchableFields.some((field) =>
            field.toLowerCase().includes(searchTerm.toLowerCase())
          )
        ) {
          return false;
        }
      }

      // Column filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && item[key] !== value) {
          return false;
        }
      }

      return true;
    });

    // Sort data
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, filters, columns]);

  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (current?.key === key) {
        if (current.direction === "asc") {
          return { key, direction: "desc" };
        }
        return null;
      }
      return { key, direction: "asc" };
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilters({});
    setSortConfig(null);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          {actions}
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button
            variant="outline"
            onClick={clearFilters}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-sm font-medium text-gray-700  ${
                      column.sortable
                        ? "cursor-pointer hover:bg-gray-100 
                        : ""
                    } ${column.width || ""}`}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          {sortConfig?.key === column.key &&
                          sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No data found
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50  ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="px-4 py-3 text-sm">
                        {column.render ? (
                          column.render(item[column.key], item)
                        ) : (
                          <span className="text-gray-900 
                            {item[column.key] || "-"}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
