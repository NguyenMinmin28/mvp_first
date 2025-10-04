"use client";

import { useState } from "react";
import { Button } from "@/ui/components/button";
import { LayoutGrid, LayoutList } from "lucide-react";

interface ViewToggleProps {
  onToggle: (isSimple: boolean) => void;
}

export function ViewToggle({ onToggle }: ViewToggleProps) {
  const [isSimple, setIsSimple] = useState(false);

  const handleToggle = () => {
    const newState = !isSimple;
    setIsSimple(newState);
    onToggle(newState);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">View:</span>
      <Button
        variant={isSimple ? "outline" : "default"}
        size="sm"
        onClick={() => {
          setIsSimple(false);
          onToggle(false);
        }}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        Detailed
      </Button>
      <Button
        variant={isSimple ? "default" : "outline"}
        size="sm"
        onClick={() => {
          setIsSimple(true);
          onToggle(true);
        }}
        className="flex items-center gap-2"
      >
        <LayoutList className="h-4 w-4" />
        Simple
      </Button>
    </div>
  );
}
