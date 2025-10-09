"use client";

import { useState, useEffect } from "react";
import { PortfolioSlot } from "./portfolio-slot";
import { Button } from "@/ui/components/button";
import { Plus } from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

interface PortfolioGridProps {
  initialPortfolios?: PortfolioItem[];
  onPortfoliosChange: (portfolios: PortfolioItem[]) => void;
}

export function PortfolioGrid({ initialPortfolios = [], onPortfoliosChange }: PortfolioGridProps) {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(() => {
    // Initialize with 5 empty slots
    const slots = Array.from({ length: 5 }, (_, index) => {
      const existing = initialPortfolios.find(p => p.id || p.title || p.imageUrl);
      return existing || {
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: "",
      };
    });
    return slots;
  });

  const [activeSlots, setActiveSlots] = useState<number[]>(() => {
    // Find which slots have content
    return portfolios
      .map((portfolio, index) => 
        portfolio.title || portfolio.description || portfolio.projectUrl || portfolio.imageUrl ? index : -1
      )
      .filter(index => index !== -1);
  });

  useEffect(() => {
    onPortfoliosChange(portfolios);
  }, [portfolios, onPortfoliosChange]);

  const handlePortfolioUpdate = (slotIndex: number, updatedPortfolio: PortfolioItem) => {
    setPortfolios(prev => {
      const newPortfolios = [...prev];
      newPortfolios[slotIndex] = updatedPortfolio;
      return newPortfolios;
    });

    // Update active slots
    const hasContent = updatedPortfolio.title || updatedPortfolio.description || 
                      updatedPortfolio.projectUrl || updatedPortfolio.imageUrl;
    
    setActiveSlots(prev => {
      if (hasContent && !prev.includes(slotIndex)) {
        return [...prev, slotIndex].sort();
      } else if (!hasContent && prev.includes(slotIndex)) {
        return prev.filter(index => index !== slotIndex);
      }
      return prev;
    });
  };

  const handlePortfolioRemove = (slotIndex: number) => {
    setPortfolios(prev => {
      const newPortfolios = [...prev];
      newPortfolios[slotIndex] = {
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: "",
      };
      return newPortfolios;
    });

    setActiveSlots(prev => prev.filter(index => index !== slotIndex));
  };

  const addNewSlot = () => {
    // Find the first empty slot
    const emptySlotIndex = portfolios.findIndex(
      portfolio => !portfolio.title && !portfolio.description && 
                  !portfolio.projectUrl && !portfolio.imageUrl
    );
    
    if (emptySlotIndex !== -1) {
      // Focus on the first empty slot
      setActiveSlots(prev => [...prev, emptySlotIndex].sort());
    }
  };

  const hasEmptySlots = activeSlots.length < 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Portfolio</h2>
          <p className="text-gray-600 mt-1">
            Showcase up to 5 of your best projects to attract clients
          </p>
        </div>
        {hasEmptySlots && (
          <Button onClick={addNewSlot} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {portfolios.map((portfolio, index) => (
          <PortfolioSlot
            key={index}
            slotIndex={index}
            portfolio={portfolio}
            onUpdate={handlePortfolioUpdate}
            onRemove={handlePortfolioRemove}
          />
        ))}
      </div>

      <div className="text-sm text-gray-500 text-center">
        {activeSlots.length} of 5 portfolio slots used
      </div>
    </div>
  );
}

