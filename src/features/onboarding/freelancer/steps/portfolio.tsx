"use client";

import { Button } from "@/ui/components/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PortfolioGrid } from "../components/portfolio-grid";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

export default function PortfolioStep() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load existing portfolios on mount
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const response = await fetch('/api/portfolio');
        if (response.ok) {
          const data = await response.json();
          setPortfolios(data.portfolios || []);
        }
      } catch (error) {
        console.error('Error loading portfolios:', error);
      }
    };

    loadPortfolios();
  }, []);

  const handlePortfoliosChange = (newPortfolios: PortfolioItem[]) => {
    setPortfolios(newPortfolios);
  };

  const handleNext = async () => {
    setIsLoading(true);
    try {
      // Save portfolios to database
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolios }),
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolios');
      }

      toast.success("Portfolio saved successfully!");
      router.push("/onboarding/freelancer/verification");
    } catch (error) {
      console.error('Error saving portfolios:', error);
      toast.error("Failed to save portfolio. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.push("/onboarding/freelancer/verification");
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Portfolio</h1>

      <PortfolioGrid 
        initialPortfolios={portfolios}
        onPortfoliosChange={handlePortfoliosChange}
      />

      <div className="pt-4 flex gap-3">
        <Button 
          className="min-w-28" 
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Next"}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleSkip}
          disabled={isLoading}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}


