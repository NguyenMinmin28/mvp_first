"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";

interface PortfolioTabProps {
  profileData: any;
  isEditing: boolean;
  onArrayFieldChange: (field: string, index: number, value: string) => void;
  onAddArrayField: (field: string) => void;
  onRemoveArrayField: (field: string, index: number) => void;
}

export default function PortfolioTab({
  profileData,
  isEditing,
  onArrayFieldChange,
  onAddArrayField,
  onRemoveArrayField,
}: PortfolioTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Links</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Add links to your projects, GitHub, or other portfolio materials
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Portfolio Links</Label>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddArrayField("portfolioLinks")}
              >
                Add Link
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {(profileData.portfolioLinks || []).map(
              (link: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) =>
                      onArrayFieldChange(
                        "portfolioLinks",
                        index,
                        e.target.value
                      )
                    }
                    disabled={!isEditing}
                    placeholder="https://example.com"
                  />
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onRemoveArrayField("portfolioLinks", index)
                      }
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )
            )}
            {(profileData.portfolioLinks || []).length === 0 && (
              <p className="text-sm text-gray-500 italic">
                No portfolio links added yet
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
