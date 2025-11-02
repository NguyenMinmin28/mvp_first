"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Plus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { ImgWithShimmer } from "@/ui/components/image-with-shimmer";

interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  imageUrl?: string;
  createdAt: string;
}

interface PortfolioGridProps {
  portfolioLinks: PortfolioItem[];
  onAddPortfolio?: () => void;
  onEditPortfolio?: (item: PortfolioItem) => void;
  onItemClick?: (item: PortfolioItem, index: number) => void;
  variant?: "public" | "edit"; // public: hide CTA and empty messages
  hideTitle?: boolean; // hide the "Portfolio" title
}

export default function PortfolioGrid({
  portfolioLinks = [],
  onAddPortfolio,
  onEditPortfolio,
  onItemClick,
  variant = "edit",
  hideTitle = false,
}: PortfolioGridProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // When public view and no portfolio at all, show branded letter placeholders
  const isAllEmpty = variant === "public" && (portfolioLinks?.length || 0) === 0;
  const brandedLetters = isAllEmpty ? ["C", "L", "E", "V", "R", "S"] : null;


  // Tạo array 6 slots, fill với portfolio có sẵn và empty slots
  const portfolioSlots = Array.from({ length: 6 }, (_, index) => {
    return portfolioLinks[index] || null;
  });

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Portfolio</h3>
          {onAddPortfolio && variant !== "public" && (
          <Button
            onClick={onAddPortfolio}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Portfolio
          </Button>
        )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {portfolioSlots.map((portfolio, index) => (
          <div
            key={portfolio?.id || `empty-${index}`}
            className="aspect-square"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {portfolio ? (
              <Card className="h-full cursor-pointer transition-all duration-200 hover:shadow-lg group">
                <CardContent className="p-0 h-full relative overflow-hidden">
                  {/* Image-only layout for public; original layout for edit */}
                  {variant === 'public' ? (
                    <div className="absolute inset-0">
                      {portfolio.imageUrl ? (
                        <ImgWithShimmer
                          src={portfolio.imageUrl}
                          alt={portfolio.title || 'Portfolio'}
                          aspectRatio="1/1"
                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          containerClassName="w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ExternalLink className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      {/* Hover overlay */}
                      <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="text-center text-white">
                          <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">View</p>
                        </div>
                      </div>
                      {/* Click surface */}
                      <button
                        type="button"
                        className="absolute inset-0 z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          if (onItemClick) {
                            onItemClick(portfolio, index);
                          } else if (portfolio.url) {
                            window.open(portfolio.url, '_blank');
                          }
                        }}
                        aria-label={portfolio.title ? `Open ${portfolio.title}` : 'Open portfolio'}
                      />
                    </div>
                  ) : (
                    <>
                      {/* Portfolio Image */}
                      <div className="h-3/4 bg-gradient-to-br from-blue-50 to-purple-50 relative">
                        {portfolio.imageUrl ? (
                          <ImgWithShimmer
                            src={portfolio.imageUrl}
                            alt={portfolio.title || 'Portfolio'}
                            aspectRatio="4/3"
                            className="w-full h-full object-cover"
                            containerClassName="w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                              <ExternalLink className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-500 font-medium">
                                {portfolio.title || ''}
                              </p>
                            </div>
                          </div>
                        )}
                        {/* Overlay on hover */}
                        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-200 ${hoveredIndex === index ? 'opacity-100' : 'opacity-0'}`}>
                          <div className="text-center text-white">
                            <ExternalLink className="w-6 h-6 mx-auto mb-2" />
                            <p className="text-sm font-medium">View Project</p>
                          </div>
                        </div>
                      </div>
                      {/* Portfolio Info */}
                      <div className="h-1/4 p-3 bg-white">
                        <h4 className="font-medium text-sm truncate mb-1">
                          {portfolio.title || ''}
                        </h4>
                        {portfolio.description && (
                          <p className="text-xs text-gray-600 truncate">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                      {/* Click handler */}
                      <a
                        href={portfolio.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(portfolio.url, '_blank');
                        }}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className={`h-full ${variant === "public" ? "border border-gray-200 bg-gray-50" : "border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"}`}>
                <CardContent className="h-full flex items-center justify-center p-4">
                  {variant === "public" ? (
                    brandedLetters ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl font-extrabold tracking-wider text-gray-400 select-none">
                          {brandedLetters[index]}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-lg" />
                      </div>
                    )
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-300 rounded-lg flex items-center justify-center mx-auto mb-3">
                        <Plus className="w-6 h-6 text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        Empty Slot
                      </p>
                      <p className="text-xs text-gray-400">
                        Add your project
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>

      {portfolioLinks.length === 0 && variant !== "public" && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No portfolio items yet
          </h3>
          <p className="text-gray-500 mb-4">
            Showcase your best work to attract more clients
          </p>
          {onAddPortfolio && (
            <Button onClick={onAddPortfolio} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Project
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
