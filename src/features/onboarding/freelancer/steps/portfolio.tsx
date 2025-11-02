"use client";

import { Button } from "@/ui/components/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
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
        console.log('🔄 Loading portfolios...');
        const response = await fetch('/api/portfolio');
        console.log('📡 Load response:', response.status, response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📦 Loaded portfolios data:', data);
          setPortfolios(data.portfolios || []);
        } else {
          console.error('❌ Failed to load portfolios:', response.status);
        }
      } catch (error) {
        console.error('💥 Error loading portfolios:', error);
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
      // Portfolios are already auto-saved, just proceed to next step
      toast.success("Portfolio completed!");
      router.push("/onboarding/freelancer/verification");
    } catch (error) {
      console.error('Error proceeding to next step:', error);
      toast.error("Failed to proceed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Portfolio</h1>

      <PortfolioGrid 
        initialPortfolios={portfolios}
        onPortfoliosChange={handlePortfoliosChange}
      />

      <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
        <Button 
          variant="outline"
          className="flex-1 sm:flex-initial min-w-28" 
          onClick={() => router.push("/onboarding/freelancer/skills-and-roles")}
          disabled={isLoading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          className="flex-1 sm:flex-initial min-w-28" 
          onClick={handleNext}
          disabled={isLoading}
        >
          {isLoading ? "Saving..." : "Next"}
        </Button>
      </div>
    </div>
  );
}


