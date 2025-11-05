"use client";

import { useState, useEffect, useRef } from "react";
import { PortfolioSlot } from "./portfolio-slot";
import { PortfolioModal } from "./portfolio-modal";
import { Button } from "@/ui/components/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string; // Main image (for backward compatibility)
  images?: string[]; // Array of images: [mainImage, ...additionalImages] (max 5)
}

interface PortfolioGridProps {
  initialPortfolios?: PortfolioItem[];
  onPortfoliosChange: (portfolios: PortfolioItem[]) => void;
}

export function PortfolioGrid({ initialPortfolios = [], onPortfoliosChange }: PortfolioGridProps) {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(() => {
    console.log('🏗️ Initializing PortfolioGrid with:', initialPortfolios);
    
    // Initialize with 6 empty slots
    const slots = Array.from({ length: 6 }, (_, index) => {
      const existing = initialPortfolios[index];
      return existing || {
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: "",
        images: [],
      };
    });
    
    console.log('📋 Initialized slots:', slots);
    return slots;
  });

  const [activeModal, setActiveModal] = useState<number | null>(null);
  const prevInitialPortfoliosRef = useRef<PortfolioItem[]>([]);
  const onPortfoliosChangeRef = useRef(onPortfoliosChange);
  const isSyncingRef = useRef(false);
  const prevPortfoliosRef = useRef<PortfolioItem[]>([]);

  // Update ref when callback changes
  useEffect(() => {
    onPortfoliosChangeRef.current = onPortfoliosChange;
  }, [onPortfoliosChange]);

  // Only call onPortfoliosChange when portfolios change due to user actions, not from initialPortfolios sync
  useEffect(() => {
    if (!isSyncingRef.current) {
      // Only call if portfolios actually changed (deep comparison)
      const prevString = JSON.stringify(prevPortfoliosRef.current);
      const currentString = JSON.stringify(portfolios);
      if (prevString !== currentString) {
        prevPortfoliosRef.current = portfolios;
        onPortfoliosChangeRef.current(portfolios);
      }
    } else {
      // Still update ref even during sync to prevent false positives
      prevPortfoliosRef.current = portfolios;
    }
  }, [portfolios]);

  // Update portfolios when initialPortfolios change (e.g., when data is loaded)
  useEffect(() => {
    // Only run once when component mounts or when initialPortfolios actually changes
    if (initialPortfolios && initialPortfolios.length > 0) {
      const currentString = JSON.stringify(prevInitialPortfoliosRef.current);
      const newString = JSON.stringify(initialPortfolios);
      
      if (currentString !== newString) {
        console.log('🔄 Updating portfolios from initialPortfolios:', initialPortfolios);
        
        // Set flag to prevent onPortfoliosChange callback during sync
        isSyncingRef.current = true;
        
        // Create 6 slots, filling with existing data where available
        const slots = Array.from({ length: 6 }, (_, index) => {
          // Find portfolio at this index position
          const existing = initialPortfolios[index] || 
                          initialPortfolios.find((p, i) => i === index) || 
                          {
                            title: "",
                            description: "",
                            projectUrl: "",
                            imageUrl: "",
                            images: ["", "", "", "", "", ""],
                          };
          
          // Ensure images array has correct structure
          if (existing.images && Array.isArray(existing.images)) {
            const normalizedImages = [...existing.images];
            while (normalizedImages.length < 6) {
              normalizedImages.push("");
            }
            existing.images = normalizedImages.slice(0, 6);
          } else if (existing.imageUrl) {
            existing.images = [existing.imageUrl, "", "", "", "", ""];
          } else {
            existing.images = ["", "", "", "", "", ""];
          }
          
          return existing;
        });
        
        console.log('📋 Created slots from initialPortfolios:', slots);
        console.log('📋 First portfolio images:', slots[0]?.images);
        setPortfolios(slots);
        
        // Update ref to prevent future loops
        prevInitialPortfoliosRef.current = initialPortfolios;
        
        // Reset flag after state update
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 0);
      }
    } else if (initialPortfolios && initialPortfolios.length === 0) {
      // Reset to empty if no portfolios
      console.log('🔄 Resetting portfolios - no initial portfolios');
      isSyncingRef.current = true;
      const emptySlots = Array.from({ length: 6 }, () => ({
        title: "",
        description: "",
        projectUrl: "",
        imageUrl: "",
        images: ["", "", "", "", "", ""],
      }));
      setPortfolios(emptySlots);
      prevInitialPortfoliosRef.current = [];
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    }
  }, [initialPortfolios]);

  const handlePortfolioEdit = (slotIndex: number) => {
    setActiveModal(slotIndex);
  };

  const handlePortfolioSave = async (slotIndex: number, updatedPortfolio: PortfolioItem) => {
    console.log('🔄 Saving portfolio:', { slotIndex, updatedPortfolio });
    
    // Prepare updated portfolios array
    setPortfolios(prev => {
      const newPortfolios = [...prev];
      newPortfolios[slotIndex] = updatedPortfolio;
      console.log('📝 Updated portfolios state:', newPortfolios);
      
      // Auto-save to database with updated data
      // Use Promise.resolve().then() to ensure state update completes first
      Promise.resolve().then(async () => {
        try {
          console.log('💾 Sending to API:', { portfolios: newPortfolios });
          
          const response = await fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolios: newPortfolios }),
          });

          console.log('📡 API Response:', response.status, response.ok);

          if (response.ok) {
            const result = await response.json();
            console.log('✅ Save successful:', result);
            toast.success("Portfolio saved automatically!");
          } else {
            const error = await response.json();
            console.error('❌ Save failed:', error);
            toast.error("Failed to save portfolio automatically");
          }
        } catch (error) {
          console.error('💥 Error auto-saving portfolio:', error);
          toast.error("Failed to save portfolio automatically");
        }
      });
      
      return newPortfolios;
    });
  };

  const handlePortfolioDelete = async (slotIndex: number) => {
    const updatedPortfolio = {
      title: "",
      description: "",
      projectUrl: "",
      imageUrl: "",
      images: [],
    };

    // Update state and prepare data for API call
    setPortfolios(prev => {
      const newPortfolios = [...prev];
      newPortfolios[slotIndex] = updatedPortfolio;
      
      // Auto-save to database with updated data
      Promise.resolve().then(async () => {
        try {
          const response = await fetch('/api/portfolio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ portfolios: newPortfolios }),
          });

          if (response.ok) {
            toast.success("Portfolio deleted and saved!");
          }
        } catch (error) {
          console.error('Error auto-saving portfolio deletion:', error);
          toast.error("Failed to delete portfolio");
        }
      });
      
      return newPortfolios;
    });
  };

  const handleCloseModal = () => {
    setActiveModal(null);
  };

  const activeSlotsCount = portfolios.filter(p => 
    p.title || p.description || p.projectUrl || p.imageUrl || (p.images && p.images.length > 0)
  ).length;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Portfolio</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Showcase up to 6 of your best projects to attract clients. Click on any slot to add or edit your portfolio projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {portfolios.map((portfolio, index) => (
          <PortfolioSlot
            key={index}
            slotIndex={index}
            portfolio={portfolio}
            onEdit={handlePortfolioEdit}
            onRemove={handlePortfolioDelete}
          />
        ))}
      </div>

      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          {activeSlotsCount} of 6 portfolio slots used
        </div>
      </div>

      {/* Portfolio Modal */}
      {activeModal !== null && (
        <PortfolioModal
          isOpen={activeModal !== null}
          onClose={handleCloseModal}
          portfolio={portfolios[activeModal]}
          onSave={(updatedPortfolio) => handlePortfolioSave(activeModal, updatedPortfolio)}
          onDelete={() => handlePortfolioDelete(activeModal)}
          slotIndex={activeModal}
        />
      )}
    </div>
  );
}

