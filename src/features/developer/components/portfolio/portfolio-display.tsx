"use client";

import { Card, CardContent } from "@/ui/components/card";
import { ExternalLink, Image as ImageIcon } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  projectUrl?: string;
  imageUrl?: string;
  sortOrder: number;
}

interface PortfolioDisplayProps {
  portfolios: PortfolioItem[];
  maxItems?: number;
}

export function PortfolioDisplay({ portfolios, maxItems = 5 }: PortfolioDisplayProps) {
  const displayPortfolios = portfolios
    .filter(portfolio => portfolio.title || portfolio.imageUrl)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, maxItems);

  if (displayPortfolios.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Portfolio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPortfolios.map((portfolio) => (
          <Card key={portfolio.id} className="overflow-hidden">
            <CardContent className="p-0">
              {portfolio.imageUrl && (
                <div className="aspect-video bg-gray-100">
                  <img
                    src={portfolio.imageUrl}
                    alt={portfolio.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <h4 className="font-medium text-sm mb-1">{portfolio.title}</h4>
                {portfolio.description && (
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {portfolio.description}
                  </p>
                )}
                {portfolio.projectUrl && (
                  <a
                    href={portfolio.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Project
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

