"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Plus, Edit3, ExternalLink } from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

interface PortfolioSlotProps {
  slotIndex: number;
  portfolio: PortfolioItem;
  onEdit: (slotIndex: number) => void;
  onRemove: (slotIndex: number) => void;
}

export function PortfolioSlot({ slotIndex, portfolio, onEdit, onRemove }: PortfolioSlotProps) {
  const hasContent = portfolio.title || portfolio.description || portfolio.projectUrl || portfolio.imageUrl;

  return (
    <Card 
      className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] group ${
        hasContent ? 'border-2 border-gray-200' : 'border-2 border-dashed border-gray-300 hover:border-gray-400'
      }`}
      onClick={() => onEdit(slotIndex)}
    >
      <CardContent className="p-0">
        {hasContent ? (
          // Portfolio with content
          <div className="relative">
            {/* Image */}
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              {portfolio.imageUrl ? (
                <img 
                  src={portfolio.imageUrl} 
                  alt={portfolio.title || "Portfolio project"} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <div className="text-4xl mb-2">📁</div>
                    <div className="text-sm">No Image</div>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 rounded-t-lg flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/90 hover:bg-white text-gray-900"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1">
                {portfolio.title || "Untitled Project"}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {portfolio.description || "No description provided"}
              </p>
              {portfolio.projectUrl && (
                <div className="flex items-center text-xs text-blue-600">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span className="truncate">View Project</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Empty slot
          <div className="aspect-video w-full flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-gray-200 transition-colors">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-gray-600" />
            </div>
            <h3 className="font-medium text-gray-600 mb-2">Add Project #{slotIndex + 1}</h3>
            <p className="text-sm text-gray-500">
              Click to add your portfolio project
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

