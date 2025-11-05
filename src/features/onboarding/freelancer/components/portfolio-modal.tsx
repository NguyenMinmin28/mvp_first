"use client";

import { useState, useEffect, useRef } from "react";
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { Textarea } from "@/ui/components/textarea";
import { useImageUpload } from "@/core/hooks/use-upload";
import { toast } from "sonner";
import { Upload, Save, Trash2, X } from "lucide-react";

interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  projectUrl: string;
  imageUrl: string; // Main image (for backward compatibility)
  images?: string[]; // Array of images: [mainImage, ...additionalImages] (max 5)
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
  
  // Support both old format (imageUrl) and new format (images array)
  const initialImages = portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [targetSlotIndex, setTargetSlotIndex] = useState<number | null>(null);
  
  // Use ref to track current uploading index to avoid closure issues
  const uploadingIndexRef = React.useRef<number | null>(null);
  
  const [mainImageInputRef, setMainImageInputRef] = useState<HTMLInputElement | null>(null);
  const [additionalImageInputRef, setAdditionalImageInputRef] = useState<HTMLInputElement | null>(null);
  
  // Update ref whenever uploadingIndex changes
  React.useEffect(() => {
    uploadingIndexRef.current = uploadingIndex;
  }, [uploadingIndex]);
  
  // Character count for description
  const charCount = description.trim().length;
  const minChars = 20;
  const descriptionError = description.trim() && charCount < minChars ? `Description must be at least ${minChars} characters (currently ${charCount})` : "";

  const { uploadImage, isUploading } = useImageUpload({
    onSuccess: (result) => {
      // Use ref to get current uploading index (avoids closure issues)
      const currentUploadingIndex = uploadingIndexRef.current;
      console.log('📸 Upload success, uploadingIndex from ref:', currentUploadingIndex);
      
      // Use functional update to ensure we have latest state
      setImages(prev => {
        console.log('🔄 Setting images, currentUploadingIndex:', currentUploadingIndex, 'prev length:', prev.length);
        
        if (currentUploadingIndex === null) {
          // Main image upload (slot 0)
          console.log('✅ Uploading to MAIN slot (0)');
          const newImages = [...prev];
          newImages[0] = result.url;
          // Ensure we have 6 slots (main + 5 additional)
          while (newImages.length < 6) {
            newImages.push("");
          }
          return newImages.slice(0, 6);
        } else if (currentUploadingIndex > 0 && currentUploadingIndex <= 5) {
          // Additional image upload (slot 1-5 only)
          console.log('✅ Uploading to ADDITIONAL slot:', currentUploadingIndex);
          const newImages = [...prev];
          // Ensure we have enough slots (at least 6)
          while (newImages.length < 6) {
            newImages.push("");
          }
          // IMPORTANT: Only update the specific slot, never touch slot 0
          const mainImageBefore = newImages[0];
          newImages[currentUploadingIndex] = result.url;
          console.log('📝 Updated slot', currentUploadingIndex);
          console.log('🔒 Main image (slot 0) BEFORE:', mainImageBefore);
          console.log('🔒 Main image (slot 0) AFTER:', newImages[0]);
          if (newImages[0] !== mainImageBefore) {
            console.error('❌ ERROR: Main image was changed! Restoring...');
            newImages[0] = mainImageBefore; // Restore if accidentally changed
          }
          return newImages;
        } else {
          console.error("❌ Invalid slot index for additional image:", currentUploadingIndex);
          toast.error("Invalid slot index");
          return prev; // Return unchanged
        }
      });
      
      if (currentUploadingIndex === null) {
        toast.success("Main image uploaded successfully!");
      } else {
        toast.success("Image uploaded successfully!");
      }
      setUploadingIndex(null);
      uploadingIndexRef.current = null;
    },
    onError: (error) => {
      console.error('❌ Portfolio image upload error:', error);
      toast.error("Failed to upload image");
      setUploadingIndex(null);
      uploadingIndexRef.current = null;
    }
  });

  // Reset form when modal opens/closes or portfolio changes
  useEffect(() => {
    if (isOpen) {
      setTitle(portfolio.title || "");
      setDescription(portfolio.description || "");
      setProjectUrl(portfolio.projectUrl || "");
      
      // Initialize images array - ensure structure [main, slot1, slot2, slot3, slot4, slot5]
      let initialImages: string[] = [];
      
      console.log('🔄 Loading portfolio images:', {
        hasImages: !!portfolio.images,
        imagesType: Array.isArray(portfolio.images),
        imagesLength: portfolio.images?.length,
        images: portfolio.images,
        imageUrl: portfolio.imageUrl
      });
      
      if (portfolio.images && Array.isArray(portfolio.images)) {
        // Filter out empty values but keep structure
        initialImages = portfolio.images.map(img => img || "");
        // Ensure we have exactly 6 slots (main + 5 additional)
        while (initialImages.length < 6) {
          initialImages.push("");
        }
        initialImages = initialImages.slice(0, 6);
        console.log('✅ Loaded images array:', initialImages);
      } else if (portfolio.imageUrl) {
        // Backward compatibility: single image becomes main image
        initialImages = [portfolio.imageUrl, "", "", "", "", ""];
        console.log('✅ Loaded from imageUrl (backward compat):', initialImages);
      } else {
        initialImages = ["", "", "", "", "", ""];
        console.log('⚠️ No images found, initializing empty');
      }
      
      // Log final state
      const nonEmptyCount = initialImages.filter(img => img && img.trim() !== "").length;
      console.log('📊 Final images array:', initialImages);
      console.log('📊 Non-empty images count:', nonEmptyCount);
      
      setImages(initialImages);
      setUploadingIndex(null);
      uploadingIndexRef.current = null;
    }
  }, [isOpen, portfolio]);

  const handleFileUpload = async (files: FileList | null, index: number | null = null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    // Check total image limit (1 main + 5 additional = 6 total)
    if (index === null) {
      // Main image upload (slot 0)
      console.log('📤 Uploading MAIN image (slot 0)');
      setUploadingIndex(null);
    } else {
      // Additional image upload - index MUST be 1-5 (never 0)
      if (index === 0) {
        console.error("❌ Cannot upload additional image to main slot (0)");
        toast.error("Invalid slot index");
        setUploadingIndex(null);
        uploadingIndexRef.current = null;
        return;
      }
      if (index < 1 || index > 5) {
        console.error("❌ Invalid slot index for additional image:", index);
        toast.error("Invalid slot index");
        setUploadingIndex(null);
        uploadingIndexRef.current = null;
        return;
      }
      
      console.log('📤 Uploading ADDITIONAL image to slot:', index);
      
      // Ensure images array has at least 6 slots before checking
      const normalizedImages = [...images];
      while (normalizedImages.length < 6) {
        normalizedImages.push("");
      }
      const currentImages = normalizedImages.slice(0, 6);
      
      // Check if we already have 5 additional images
      // Only count non-empty images in slots 1-5
      const additionalCount = currentImages.slice(1, 6).filter(img => img && img.trim() !== "").length;
      
      // If slot is empty (adding new), check if we've reached the limit
      // If slot has image (replacing), allow it
      const slotImage = currentImages[index] || "";
      const isReplacing = slotImage && slotImage.trim() !== "";
      
      console.log('🔍 Upload check:', {
        index,
        additionalCount,
        isReplacing,
        slotImage,
        currentImages: currentImages
      });
      
      if (!isReplacing && additionalCount >= 5) {
        console.error("❌ Already have 5 additional images, cannot add more. Count:", additionalCount);
        toast.error("Maximum 5 additional images allowed");
        setUploadingIndex(null);
        uploadingIndexRef.current = null;
        return;
      }
      
      console.log('✅ Additional images check passed. Count:', additionalCount, 'Is replacing:', isReplacing);
      
      // uploadingIndex should already be set in onChange, but ensure it's set here too
      if (uploadingIndex !== index) {
        console.log('⚠️ Warning: uploadingIndex mismatch, setting to:', index);
        setUploadingIndex(index);
      }
      uploadingIndexRef.current = index;
    }

    try {
      await uploadImage(file, "portfolio", 10);
    } catch (error) {
      console.error("❌ Failed to upload image:", error);
      toast.error("Failed to upload image");
      setUploadingIndex(null);
      uploadingIndexRef.current = null;
    }
  };

  const handleRemoveImage = (index: number) => {
    if (index === 0 && images.length > 1) {
      toast.error("Main image cannot be removed. Replace it with another image.");
      return;
    }
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const triggerMainImageInput = () => {
    mainImageInputRef?.click();
  };

  const triggerAdditionalImageInput = (slotIndex?: number) => {
    console.log('🔔 triggerAdditionalImageInput called with slotIndex:', slotIndex);
    
    // Check current state
    const normalizedImages = [...images];
    while (normalizedImages.length < 6) {
      normalizedImages.push("");
    }
    const currentImages = normalizedImages.slice(0, 6);
    const additionalCount = currentImages.slice(1, 6).filter(img => img && img.trim() !== "").length;
    
    console.log('📊 Current state:', {
      additionalCount,
      slotIndex,
      currentImages
    });
    
    // If slotIndex is provided, check if that slot is empty or if we can replace
    if (slotIndex !== undefined && slotIndex >= 1 && slotIndex <= 5) {
      const slotImage = currentImages[slotIndex] || "";
      const isSlotEmpty = !slotImage || slotImage.trim() === "";
      
      // Only block if slot is empty AND we already have 5 additional images
      if (isSlotEmpty && additionalCount >= 5) {
        console.error("❌ Cannot add more - already have 5 additional images");
        toast.error("Maximum 5 additional images allowed");
        return;
      }
      
      // Allow: either replacing existing image OR adding new one when count < 5
      console.log('✅ Allowing upload to slot', slotIndex, 'isSlotEmpty:', isSlotEmpty);
      setTargetSlotIndex(slotIndex);
      setTimeout(() => {
        additionalImageInputRef?.click();
      }, 0);
    } else {
      // No slot specified, find first empty
      if (additionalCount >= 5) {
        console.error("❌ Cannot add more - already have 5 additional images");
        toast.error("Maximum 5 additional images allowed");
        return;
      }
      console.log('✅ Finding first empty slot');
      additionalImageInputRef?.click();
    }
  };

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      toast.error("Project title is required");
      return;
    }
    
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }

    if (charCount < minChars) {
      toast.error(`Description must be at least ${minChars} characters (currently ${charCount})`);
      return;
    }

    if (images.length === 0 || !images[0]) {
      toast.error("Main image is required");
      return;
    }

    // Ensure we only save up to 6 images (1 main + 5 additional)
    // Keep structure: [main, slot1, slot2, slot3, slot4, slot5]
    // Normalize: ensure exactly 6 slots
    const normalizedImages: string[] = [];
    for (let i = 0; i < 6; i++) {
      normalizedImages.push(images[i] || "");
    }
    
    const updatedPortfolio: PortfolioItem = {
      ...portfolio,
      title: title.trim(),
      description: description.trim(),
      projectUrl: projectUrl.trim(),
      imageUrl: normalizedImages[0] || "", // Main image for backward compatibility
      images: normalizedImages, // Array with structure: [main, slot1, slot2, slot3, slot4, slot5]
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

  const hasContent = title.trim() || description.trim() || projectUrl.trim() || images.length > 0;
  const mainImage = images[0] || "";
  
  // Ensure images array has at least 6 slots
  const normalizedImages = [...images];
  while (normalizedImages.length < 6) {
    normalizedImages.push("");
  }
  const finalImages = normalizedImages.slice(0, 6);
  
  const additionalImages = finalImages.slice(1, 6); // Only slots 1-5
  // Only count non-empty images (filter out empty strings)
  const additionalCount = additionalImages.filter(img => img && img.trim() !== "").length;
  const canAddMoreImages = additionalCount < 5;
  
  console.log('📊 Images state:', {
    imagesLength: images.length,
    finalImagesLength: finalImages.length,
    additionalImages: additionalImages,
    additionalCount,
    canAddMoreImages,
    finalImages: finalImages
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Portfolio Project #{slotIndex + 1}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Main Image Upload Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Main Image *</Label>
            
            {/* Hidden file input for main image */}
            <input
              ref={setMainImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files, null)}
              disabled={isUploading && uploadingIndex === null}
              className="hidden"
            />
            
            {mainImage ? (
              <div className="relative group">
                <img 
                  src={mainImage} 
                  alt="Main portfolio" 
                  className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                />
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer"
                  onClick={triggerMainImageInput}
                >
                  <div className="text-white text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2" />
                    <div className="text-sm">
                      {isUploading && uploadingIndex === null ? "Uploading..." : "Click to change main image"}
                    </div>
                  </div>
                </div>
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Main
                </div>
              </div>
            ) : (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={triggerMainImageInput}
              >
                <div className="flex flex-col items-center space-y-3">
                  {isUploading && uploadingIndex === null ? (
                    <div className="text-gray-500">Uploading...</div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div className="text-lg font-medium text-gray-600">
                        Upload Main Project Image
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

          {/* Additional Images Section - 5 fixed slots */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Additional Images (Optional)</Label>
            
            {/* Hidden file input for additional images */}
            <input
              ref={setAdditionalImageInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const fileList = e.target.files;
                if (fileList && fileList.length > 0) {
                  // Use target slot index if set, otherwise find first empty slot (1-5 only)
                  let targetIndex: number;
                  
                  // Get current targetSlotIndex value before resetting
                  const currentTargetSlot = targetSlotIndex;
                  
                  if (currentTargetSlot !== null && currentTargetSlot >= 1 && currentTargetSlot <= 5) {
                    targetIndex = currentTargetSlot;
                    console.log('🎯 Using targetSlotIndex:', targetIndex);
                    setTargetSlotIndex(null);
                  } else {
                    // Ensure images array has at least 6 slots
                    const normalizedImages = [...images];
                    while (normalizedImages.length < 6) {
                      normalizedImages.push("");
                    }
                    const currentImages = normalizedImages.slice(0, 6);
                    
                    // Find first empty slot in range 1-5 (never use slot 0 which is main)
                    // Empty means undefined, null, empty string, or not exists
                    const firstEmptyIndex = currentImages.findIndex((img, idx) => 
                      idx >= 1 && idx <= 5 && (!img || img.trim() === "")
                    );
                    if (firstEmptyIndex >= 1 && firstEmptyIndex <= 5) {
                      targetIndex = firstEmptyIndex;
                      console.log('🔍 Found empty slot at index:', targetIndex);
                    } else {
                      // Check actual count before showing error
                      const actualCount = currentImages.slice(1, 6).filter(img => img && img.trim() !== "").length;
                      if (actualCount >= 5) {
                        console.error("❌ All 5 additional image slots are full. Count:", actualCount);
                        toast.error("All additional image slots are full");
                      } else {
                        console.error("❌ No empty slot found but count is:", actualCount, "This shouldn't happen");
                        console.error("Current images:", currentImages);
                        toast.error("Cannot find empty slot");
                      }
                      if (e.target) {
                        e.target.value = '';
                      }
                      return;
                    }
                  }
                  
                  // Validate targetIndex is between 1-5 (never 0)
                  if (targetIndex < 1 || targetIndex > 5) {
                    console.error("❌ Invalid targetIndex for additional image:", targetIndex);
                    toast.error("Invalid slot index");
                    if (e.target) {
                      e.target.value = '';
                    }
                    return;
                  }
                  
                  console.log('📤 Starting upload to ADDITIONAL slot:', targetIndex);
                  
                  // Ensure images array is large enough (at least 6 slots)
                  setImages(prev => {
                    const newImages = [...prev];
                    while (newImages.length < 6) {
                      newImages.push("");
                    }
                    return newImages;
                  });
                  
                  // Set uploadingIndex and ref BEFORE calling handleFileUpload
                  setUploadingIndex(targetIndex);
                  uploadingIndexRef.current = targetIndex;
                  
                  handleFileUpload(fileList, targetIndex);
                }
                // Reset input
                if (e.target) {
                  e.target.value = '';
                }
              }}
              disabled={isUploading}
              className="hidden"
            />

            {/* 5 fixed slots for additional images */}
            <div className="grid grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, index) => {
                const slotIndex = index + 1; // +1 because index 0 is main image
                // Use normalized images array to ensure we have the slot
                const imageUrl = (slotIndex < finalImages.length ? finalImages[slotIndex] : "") || "";
                const isEmpty = !imageUrl || imageUrl.trim() === "";
                const isUploadingSlot = uploadingIndex === slotIndex;
                
                console.log(`🎨 Slot ${slotIndex} render:`, {
                  imageUrl,
                  isEmpty,
                  isUploadingSlot,
                  imagesLength: images.length,
                  finalImagesLength: finalImages.length,
                  canAddMoreImages
                });

                return (
                  <div
                    key={index}
                    className="aspect-square relative"
                  >
                    {!isEmpty && imageUrl && imageUrl.trim() !== "" ? (
                      <div className="relative group w-full h-full">
                        <img 
                          src={imageUrl} 
                          alt={`Additional ${index + 1}`} 
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                          onError={(e) => {
                            console.error(`❌ Failed to load image at slot ${slotIndex}:`, imageUrl);
                            // Optionally set image to empty on error
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log(`✅ Successfully loaded image at slot ${slotIndex}`);
                          }}
                        />
                        <button
                          onClick={() => handleRemoveImage(slotIndex)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className={`w-full h-full border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
                          isUploadingSlot 
                            ? "border-blue-400 bg-blue-50" 
                            : canAddMoreImages
                            ? "border-gray-300 hover:border-gray-400 bg-gray-50"
                            : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        }`}
                        onClick={() => {
                          if (!isUploading) {
                            console.log('🖱️ Clicked on slot', slotIndex, 'canAddMoreImages:', canAddMoreImages);
                            // Allow click, but check in onChange and handleFileUpload
                            triggerAdditionalImageInput(slotIndex);
                          } else {
                            console.log('⏳ Upload in progress, ignoring click');
                          }
                        }}
                      >
                        {isUploadingSlot ? (
                          <div className="text-xs text-gray-500 text-center px-2">
                            Uploading...
                          </div>
                        ) : canAddMoreImages ? (
                          <div className="text-center p-2">
                            <Upload className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <div className="text-xs text-gray-500">Add</div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Description *</Label>
                <span className={`text-sm ${charCount < minChars ? "text-red-500" : "text-gray-500"}`}>
                  {charCount}/{minChars} characters minimum
                </span>
              </div>
              <Textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you built, technologies used, and key features. Minimum 20 characters required."
                rows={6}
                className={`text-base resize-none ${descriptionError ? "border-red-500 focus:ring-red-500" : ""}`}
              />
              {descriptionError && (
                <p className="text-sm text-red-500">{descriptionError}</p>
              )}
              {!descriptionError && description.trim() && charCount >= minChars && (
                <p className="text-sm text-green-600">✓ Description meets minimum character requirement</p>
              )}
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
                disabled={!title.trim() || !description.trim() || charCount < minChars || !mainImage}
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
