"use client";

import { useState } from "react";
import { Badge } from "@/ui/components/badge";
import { Button } from "@/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/ui/components/card";
import type { SubscriptionPackage } from "@/features/subscription-packages/types/subscription-package.type";

interface SubscriptionPackageCardProps {
  package_: SubscriptionPackage;
  onSelect?: (package_: SubscriptionPackage) => void;
  showActions?: boolean;
}

export function SubscriptionPackageCard({
  package_,
  onSelect,
  showActions = true,
}: SubscriptionPackageCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async () => {
    if (!onSelect) return;
    
    setIsLoading(true);
    try {
      await onSelect(package_);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={`relative ${package_.isPopular ? 'border-primary shadow-lg' : ''}`}>
      {package_.isPopular && (
        <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
          Popular
        </Badge>
      )}
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {package_.name}
          <span className="text-2xl font-bold text-primary">
            ${package_.priceUSD}
          </span>
        </CardTitle>
        <CardDescription>
          {package_.projectsPerMonth} projects per month
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Contact reveals per project:</span>
            <span className="font-semibold">{package_.contactClicksPerProject}</span>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Features:</h4>
            <ul className="space-y-1">
              {package_.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm">
                  <span className="mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter>
          <Button 
            onClick={handleSelect}
            disabled={isLoading || !package_.active}
            className="w-full"
            variant={package_.isPopular ? "default" : "outline"}
          >
            {isLoading ? "Loading..." : package_.active ? "Select Plan" : "Unavailable"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
