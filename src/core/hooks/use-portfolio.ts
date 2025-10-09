import { useState, useEffect } from "react";
import { toast } from "sonner";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

export function usePortfolio() {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load portfolios
  const loadPortfolios = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio');
      if (response.ok) {
        const data = await response.json();
        setPortfolios(data.portfolios || []);
      } else {
        throw new Error('Failed to load portfolios');
      }
    } catch (error) {
      console.error('Error loading portfolios:', error);
      toast.error("Failed to load portfolios");
    } finally {
      setIsLoading(false);
    }
  };

  // Save portfolios
  const savePortfolios = async (newPortfolios: PortfolioItem[]) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolios: newPortfolios }),
      });

      if (!response.ok) {
        throw new Error('Failed to save portfolios');
      }

      const data = await response.json();
      setPortfolios(data.portfolios || []);
      toast.success("Portfolio saved successfully!");
      return true;
    } catch (error) {
      console.error('Error saving portfolios:', error);
      toast.error("Failed to save portfolio. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update single portfolio
  const updatePortfolio = async (id: string, portfolio: Omit<PortfolioItem, 'id'>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portfolio),
      });

      if (!response.ok) {
        throw new Error('Failed to update portfolio');
      }

      const data = await response.json();
      setPortfolios(prev => 
        prev.map(p => p.id === id ? data.portfolio : p)
      );
      toast.success("Portfolio updated successfully!");
      return true;
    } catch (error) {
      console.error('Error updating portfolio:', error);
      toast.error("Failed to update portfolio. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete portfolio
  const deletePortfolio = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete portfolio');
      }

      setPortfolios(prev => prev.filter(p => p.id !== id));
      toast.success("Portfolio deleted successfully!");
      return true;
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      toast.error("Failed to delete portfolio. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Load portfolios on mount
  useEffect(() => {
    loadPortfolios();
  }, []);

  return {
    portfolios,
    isLoading,
    loadPortfolios,
    savePortfolios,
    updatePortfolio,
    deletePortfolio,
  };
}

