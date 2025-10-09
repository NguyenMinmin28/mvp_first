"use client";

import { useState, useEffect } from "react";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { usePortfolio } from "@/core/hooks/use-portfolio";
import { PortfolioGrid } from "@/features/onboarding/freelancer/components/portfolio-grid";
import { toast } from "sonner";
import { Plus, Edit3 } from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

export function PortfolioManager() {
  const { portfolios, isLoading, savePortfolios } = usePortfolio();
  const [isEditing, setIsEditing] = useState(false);
  const [editedPortfolios, setEditedPortfolios] = useState<PortfolioItem[]>([]);

  useEffect(() => {
    setEditedPortfolios(portfolios);
  }, [portfolios]);

  const handleSave = async () => {
    const success = await savePortfolios(editedPortfolios);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedPortfolios(portfolios);
    setIsEditing(false);
  };

  const handlePortfoliosChange = (newPortfolios: PortfolioItem[]) => {
    setEditedPortfolios(newPortfolios);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading portfolios...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Portfolio Management</CardTitle>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Portfolio
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-6">
            <PortfolioGrid 
              initialPortfolios={editedPortfolios}
              onPortfoliosChange={handlePortfoliosChange}
            />
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {portfolios.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No portfolio items yet.</p>
                <Button 
                  onClick={() => setIsEditing(true)} 
                  variant="outline" 
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Project
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolios
                  .filter(p => p.title || p.imageUrl)
                  .sort((a, b) => (a.id ? 0 : 1) - (b.id ? 0 : 1))
                  .map((portfolio, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      {portfolio.imageUrl && (
                        <img
                          src={portfolio.imageUrl}
                          alt={portfolio.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                      )}
                      <h4 className="font-medium">{portfolio.title || "Untitled Project"}</h4>
                      {portfolio.description && (
                        <p className="text-sm text-gray-600 mt-1">{portfolio.description}</p>
                      )}
                      {portfolio.projectUrl && (
                        <a
                          href={portfolio.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                        >
                          View Project →
                        </a>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

