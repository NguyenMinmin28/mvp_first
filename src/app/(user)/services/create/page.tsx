"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { X, Plus, Upload, Image as ImageIcon, DollarSign, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import { UserLayout } from "@/features/shared/components/user-layout";

interface ServiceFormData {
  title: string;
  description: string;
  skills: string[];
  pricing: {
    type: 'hourly' | 'fixed';
    amount: number;
  };
  timeline: string;
  location: string;
  // Image structure matching the detail view
  mainImage: string; // Cover image (16:9 aspect ratio)
  galleryImages: string[]; // Gallery grid (3x3 = 9 images)
  showcaseImages: string[]; // Additional showcase images (2 large images)
}

export default function CreateServicePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [currentImageSection, setCurrentImageSection] = useState<'main' | 'gallery' | 'showcase'>('main');
  
  const [formData, setFormData] = useState<ServiceFormData>({
    title: "",
    description: "",
    skills: [],
    pricing: {
      type: 'hourly',
      amount: 0
    },
    timeline: "",
    location: "",
    mainImage: "",
    galleryImages: [],
    showcaseImages: []
  });

  const handleInputChange = (field: keyof ServiceFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePricingChange = (field: keyof ServiceFormData['pricing'], value: any) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const addImage = () => {
    const trimmedUrl = newImageUrl.trim();
    if (!trimmedUrl) return;

    // Basic URL validation
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    if (!urlPattern.test(trimmedUrl)) {
      toast.error("Please provide a valid image URL (jpg, jpeg, png, gif, webp)");
      return;
    }

    // Check limits based on current section
    if (currentImageSection === 'main') {
      setFormData(prev => ({
        ...prev,
        mainImage: trimmedUrl
      }));
    } else if (currentImageSection === 'gallery') {
      if (formData.galleryImages.length >= 9) {
        toast.error("Maximum 9 gallery images allowed");
        return;
      }
      if (formData.galleryImages.includes(trimmedUrl)) {
        toast.error("This image is already in the gallery");
        return;
      }
      setFormData(prev => ({
        ...prev,
        galleryImages: [...prev.galleryImages, trimmedUrl]
      }));
    } else if (currentImageSection === 'showcase') {
      if (formData.showcaseImages.length >= 2) {
        toast.error("Maximum 2 showcase images allowed");
        return;
      }
      if (formData.showcaseImages.includes(trimmedUrl)) {
        toast.error("This image is already in the showcase");
        return;
      }
      setFormData(prev => ({
        ...prev,
        showcaseImages: [...prev.showcaseImages, trimmedUrl]
      }));
    }
    
    setNewImageUrl("");
  };

  const removeImage = (imageToRemove: string, section: 'main' | 'gallery' | 'showcase') => {
    if (section === 'main') {
      setFormData(prev => ({
        ...prev,
        mainImage: ""
      }));
    } else if (section === 'gallery') {
      setFormData(prev => ({
        ...prev,
        galleryImages: prev.galleryImages.filter(img => img !== imageToRemove)
      }));
    } else if (section === 'showcase') {
      setFormData(prev => ({
        ...prev,
        showcaseImages: prev.showcaseImages.filter(img => img !== imageToRemove)
      }));
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Service title is required");
    } else if (formData.title.length < 5) {
      errors.push("Service title must be at least 5 characters");
    }

    if (!formData.description.trim()) {
      errors.push("Service description is required");
    } else if (formData.description.length < 20) {
      errors.push("Service description must be at least 20 characters");
    }

    if (!formData.mainImage) {
      errors.push("Main cover image is required");
    }

    if (formData.galleryImages.length === 0) {
      errors.push("At least one gallery image is required");
    }

    if (formData.pricing.amount <= 0) {
      errors.push("Pricing amount must be greater than 0");
    }

    if (formData.skills.length === 0) {
      errors.push("At least one skill is required");
    }

    // Validate image URLs
    const urlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i;
    
    if (formData.mainImage && !urlPattern.test(formData.mainImage)) {
      errors.push("Main image URL is invalid");
    }
    
    const invalidGalleryImages = formData.galleryImages.filter(url => !urlPattern.test(url));
    if (invalidGalleryImages.length > 0) {
      errors.push("Some gallery image URLs are invalid");
    }
    
    const invalidShowcaseImages = formData.showcaseImages.filter(url => !urlPattern.test(url));
    if (invalidShowcaseImages.length > 0) {
      errors.push("Some showcase image URLs are invalid");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', formData);
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      console.log('Validation errors:', validationErrors);
      validationErrors.forEach(error => toast.error(error));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          skills: formData.skills,
          pricing: formData.pricing,
          timeline: formData.timeline,
          location: formData.location,
          mainImage: formData.mainImage,
          galleryImages: formData.galleryImages,
          showcaseImages: formData.showcaseImages
        }),
      });

      console.log('API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Service created successfully:', result);
        toast.success("Service created successfully!");
        router.push('/services');
      } else {
        const error = await response.json();
        console.error('API error:', error);
        toast.error(error.message || "Failed to create service");
      }
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error("Failed to create service");
    } finally {
      setIsSubmitting(false);
    }
  };

    return (
    <UserLayout user={session?.user}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
            <p className="mt-2 text-gray-600">Showcase your skills and attract clients</p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Product Photography & Styling"
                  className="w-full"
                  maxLength={100}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.title.length}/100 characters
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your service in detail..."
                  rows={4}
                  className="w-full"
                  maxLength={2000}
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/2000 characters
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Timeline
                  </label>
                  <Input
                    value={formData.timeline}
                    onChange={(e) => handleInputChange('timeline', e.target.value)}
                    placeholder="e.g., 1-2 weeks"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Remote, New York, NY"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills & Technologies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill or technology"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricingType"
                    value="hourly"
                    checked={formData.pricing.type === 'hourly'}
                    onChange={(e) => handlePricingChange('type', e.target.value)}
                    className="rounded"
                  />
                  Hourly Rate
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="pricingType"
                    value="fixed"
                    checked={formData.pricing.type === 'fixed'}
                    onChange={(e) => handlePricingChange('type', e.target.value)}
                    className="rounded"
                  />
                  Fixed Price
                </label>
              </div>

              <div className="flex gap-2">
                <span className="text-2xl font-bold text-gray-500">$</span>
                <Input
                  type="number"
                  value={formData.pricing.amount}
                  onChange={(e) => handlePricingChange('amount', Number(e.target.value))}
                  placeholder="0"
                  className="w-32"
                  min="1"
                  step="0.01"
                />
                <span className="text-gray-500 self-center">
                  {formData.pricing.type === 'hourly' ? '/hour' : 'total'}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {formData.pricing.type === 'hourly' 
                  ? "Set your hourly rate for this service"
                  : "Set the total price for this service"
                }
              </div>
            </CardContent>
          </Card>

          {/* Main Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Main Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                This will be the main image displayed at the top of your service (16:9 aspect ratio recommended)
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={currentImageSection === 'main' ? newImageUrl : ''}
                  onChange={(e) => {
                    setCurrentImageSection('main');
                    setNewImageUrl(e.target.value);
                  }}
                  placeholder="Paste main image URL here"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    setCurrentImageSection('main');
                    addImage();
                  }} 
                  variant="outline" 
                  disabled={!newImageUrl.trim() || currentImageSection !== 'main'}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.mainImage && (
                <div className="relative group">
                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-blue-500 ring-2 ring-blue-200">
                    <img
                      src={formData.mainImage}
                      alt="Main cover image"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/placeholder.jpg';
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Main Cover
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => removeImage(formData.mainImage, 'main')}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gallery Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Gallery Images (3x3 Grid)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Add up to 9 images that will be displayed in a 3x3 grid gallery
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={currentImageSection === 'gallery' ? newImageUrl : ''}
                  onChange={(e) => {
                    setCurrentImageSection('gallery');
                    setNewImageUrl(e.target.value);
                  }}
                  placeholder="Paste gallery image URL here"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    setCurrentImageSection('gallery');
                    addImage();
                  }} 
                  variant="outline" 
                  disabled={!newImageUrl.trim() || currentImageSection !== 'gallery'}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                {formData.galleryImages.length}/9 gallery images added
              </div>

              {formData.galleryImages.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {formData.galleryImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={imageUrl}
                          alt={`Gallery ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                        />
                        <div className="absolute top-1 left-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded">
                          {index + 1}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeImage(imageUrl, 'gallery')}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Showcase Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Showcase Images (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                Add up to 2 additional large showcase images (16:9 aspect ratio recommended)
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={currentImageSection === 'showcase' ? newImageUrl : ''}
                  onChange={(e) => {
                    setCurrentImageSection('showcase');
                    setNewImageUrl(e.target.value);
                  }}
                  placeholder="Paste showcase image URL here"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <Button 
                  type="button" 
                  onClick={() => {
                    setCurrentImageSection('showcase');
                    addImage();
                  }} 
                  variant="outline" 
                  disabled={!newImageUrl.trim() || currentImageSection !== 'showcase'}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500">
                {formData.showcaseImages.length}/2 showcase images added
              </div>

              {formData.showcaseImages.length > 0 && (
                <div className="space-y-4">
                  {formData.showcaseImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-gray-200">
                        <img
                          src={imageUrl}
                          alt={`Showcase ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/images/placeholder.jpg';
                          }}
                        />
                        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          Showcase {index + 1}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeImage(imageUrl, 'showcase')}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
            </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                console.log('Current form data:', formData);
                console.log('Validation errors:', validateForm());
              }}
            >
              Debug Form
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-black hover:bg-black/90"
            >
              {isSubmitting ? "Creating..." : "Create Service"}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </UserLayout>
  );
}