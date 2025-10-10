"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { useImageUpload } from "@/core/hooks/use-upload";
import { toast } from "sonner";
import { Upload, Save, Trash2 } from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string;
}

interface PortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioItem;
  onSave: (portfolio: PortfolioItem) => void;
  onDelete?: () => void;
  slotIndex: number;
}

export function PortfolioModal({ 
  isOpen, 
  onClose, 
  portfolio, 
  onSave, 
  onDelete,
  slotIndex 
}: PortfolioModalProps) {
  const [title, setTitle] = useState(portfolio.title || "");
  const [description, setDescription] = useState(portfolio.description || "");
  const [projectUrl, setProjectUrl] = useState(portfolio.projectUrl || "");
  const [imageUrl, setImageUrl] = useState(portfolio.imageUrl || "");
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: (result) => {
      setImageUrl(result.url);
      toast.success("Image uploaded successfully!");
    },
    onError: (error) => {
      console.error('Portfolio image upload error:', error);
      toast.error("Failed to upload image");
    }
  });

  // Reset form when modal opens/closes or portfolio changes
  useEffect(() => {
    if (isOpen) {
      setTitle(portfolio.title || "");
      setDescription(portfolio.description || "");
      setProjectUrl(portfolio.projectUrl || "");
      setImageUrl(portfolio.imageUrl || "");
    }
  }, [isOpen, portfolio]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    try {
      await uploadImage(file, "portfolio", 10);
    } catch (error) {
      console.error("Failed to upload image:", error);
      toast.error("Failed to upload image");
    }
  };

  const triggerFileInput = () => {
    fileInputRef?.click();
  };

  const handleSave = () => {
    const updatedPortfolio = {
      ...portfolio,
      title: title.trim(),
      description: description.trim(),
      projectUrl: projectUrl.trim(),
      imageUrl: imageUrl.trim(),
    };
    
    onSave(updatedPortfolio);
    onClose();
    // Toast will be shown by the auto-save function
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
      onClose();
      toast.success("Portfolio deleted!");
    }
  };

  const hasContent = title.trim() || description.trim() || projectUrl.trim() || imageUrl.trim();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Portfolio Project #{slotIndex + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Project Image</Label>
            
            {/* Hidden file input */}
            <input
              ref={setFileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              disabled={isUploading}
              className="hidden"
            />
            
            {imageUrl ? (
              <div className="relative group">
                <img 
                  src={imageUrl} 
                  alt="Portfolio" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <div className="text-white text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm">
                      {isUploading ? "Uploading..." : "Click to change image"}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={triggerFileInput}
              >
                <div className="flex flex-col items-center space-y-3">
                  {isUploading ? (
                    <div className="text-gray-500">Uploading...</div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div className="text-lg font-medium text-gray-600">
                        Upload Project Image
                      </div>
                      <div className="text-sm text-gray-500">
                        Click to browse files
                      </div>
                      <div className="text-xs text-gray-400">
                        Max 10MB, JPG/PNG/GIF recommended
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Project Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Project Title *</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a compelling project title"
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Description *</Label>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you built, technologies used, and key features..."
                rows={4}
                className="text-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Project URL (Optional)</Label>
              <Input 
                value={projectUrl} 
                onChange={(e) => setProjectUrl(e.target.value)}
                placeholder="https://your-project.com or GitHub repository"
                type="url"
                className="text-base"
              />
              <p className="text-xs text-gray-500">
                Link to live demo, GitHub repo, or project documentation
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              {hasContent && onDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={!title.trim() || !description.trim()}
                className="min-w-24"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
