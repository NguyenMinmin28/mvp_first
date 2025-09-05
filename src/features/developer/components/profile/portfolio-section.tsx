"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { ExternalLink } from "lucide-react";

interface PortfolioSectionProps {
  portfolioLinks?: string[];
}

export default function PortfolioSection({ portfolioLinks }: PortfolioSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-bold">Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        {portfolioLinks && portfolioLinks.length > 0 ? (
          <div className="space-y-3">
            {portfolioLinks.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-gray-400" />
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline break-all"
                >
                  {url}
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">No portfolio links provided</div>
        )}
      </CardContent>
    </Card>
  );
}
