"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { CountryCitySelect, countriesWithCities } from "@/ui/components/country-city-select";
import { useImageUpload } from "@/core/hooks/use-upload";

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
  const [skillQuery, setSkillQuery] = useState("");
  const [skillOpen, setSkillOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string }[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [currentImageSection, setCurrentImageSection] = useState<'main' | 'gallery' | 'showcase'>('main');
  const [locationCountry, setLocationCountry] = useState<string>("");
  const [locationCity, setLocationCity] = useState<string>("");
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const { uploadImage, isUploading } = useImageUpload();
  const skillDropdownRef = useRef<HTMLDivElement>(null);
  
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

  // Load developer profile location on mount
  useEffect(() => {
    const loadDeveloperLocation = async () => {
      if (!session?.user?.id) return;
      
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          // Location is returned directly in the user data object, not in developerProfile
          const developerLocation = data?.location;
          
          if (developerLocation && !locationCountry && !locationCity) {
            // Parse existing location format (e.g., "San Francisco, United States")
            const parts = developerLocation.split(",").map((p: string) => p.trim());
            if (parts.length >= 2) {
              // Try to find country from the last part
              const countryName = parts[parts.length - 1];
              const countryData = countriesWithCities.find(
                (c) => c.name.toLowerCase() === countryName.toLowerCase()
              );
              if (countryData) {
                setLocationCountry(countryData.code);
                // Try to match city
                const cityPart = parts.slice(0, -1).join(", ");
                const cityMatch = countryData.cities.find((c) =>
                  c.toLowerCase().includes(cityPart.toLowerCase())
                );
                if (cityMatch) {
                  setLocationCity(cityMatch);
                } else {
                  // If exact match not found, use the city part as is
                  setLocationCity(cityPart);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error loading developer location:", error);
      }
    };

    loadDeveloperLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]); // Only run once on mount

  // Parse existing location if it's in the old format (only on initial load)
  useEffect(() => {
    if (formData.location && !locationCountry && !locationCity && typeof window !== 'undefined') {
      // Try to parse existing location format (e.g., "San Francisco, CA, United States")
      const parts = formData.location.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        // Try to find country from the last part
        const countryName = parts[parts.length - 1];
        const countryData = countriesWithCities.find(
          (c) => c.name.toLowerCase() === countryName.toLowerCase()
        );
        if (countryData) {
          setLocationCountry(countryData.code);
          // Try to match city
          const cityPart = parts.slice(0, -1).join(", ");
          const cityMatch = countryData.cities.find((c) =>
            c.toLowerCase().includes(cityPart.toLowerCase())
          );
          if (cityMatch) {
            setLocationCity(cityMatch);
          } else {
            // If exact match not found, use the city part as is
            setLocationCity(cityPart);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Update location string when country/city changes
  useEffect(() => {
    if (locationCountry && locationCity) {
      const countryData = countriesWithCities.find((c) => c.code === locationCountry);
      if (countryData) {
        const newLocation = `${locationCity}, ${countryData.name}`;
        setFormData(prev => ({
          ...prev,
          location: newLocation
        }));
      }
    } else if (!locationCountry && !locationCity) {
      // Clear location if both are cleared
      setFormData(prev => ({
        ...prev,
        location: ""
      }));
    }
  }, [locationCountry, locationCity]);

  // Fetch skills from database
  useEffect(() => {
    const fetchSkills = async () => {
      setSkillsLoading(true);
      try {
        const res = await fetch("/api/skills?limit=200", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.skills)) {
            setAvailableSkills(data.skills.map((s: any) => ({ 
              id: s.id || s._id || s.name, 
              name: s.name 
            })));
          } else {
            console.error("Skills API returned invalid data:", data);
            setAvailableSkills([]);
          }
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        setAvailableSkills([]);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
  }, []);

  // Filter skills based on query
  const filteredSkills = useMemo(() => {
    const selected = new Set(formData.skills);
    if (!Array.isArray(availableSkills)) return [];
    
    const query = skillQuery.trim().toLowerCase();
    let filtered = availableSkills.filter((s) => !selected.has(s.name));
    
    if (query) {
      filtered = filtered.filter((s) => 
        s.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [availableSkills, formData.skills, skillQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(event.target as Node)
      ) {
        setSkillOpen(false);
      }
    };

    const handleScroll = () => {
      setSkillOpen(false);
    };

    const handleResize = () => {
      setSkillOpen(false);
    };

    if (skillOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [skillOpen]);

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

  const addSkill = (skillName: string) => {
    if (!formData.skills.includes(skillName)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillName]
      }));
      setNewSkill("");
      setSkillQuery("");
      setSkillOpen(false);
    }
  };

  const addSkillFromInput = () => {
    const trimmed = newSkill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      addSkill(trimmed);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleFileUpload = async (files: FileList | null, section: 'main' | 'gallery' | 'showcase', index?: number) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File is too large (max 10MB)");
      return;
    }

    // Check limits based on current section
    if (section === 'main') {
      setUploadingIndex(null);
    } else if (section === 'gallery') {
      if (formData.galleryImages.length >= 9 && index === undefined) {
        toast.error("Maximum 9 gallery images allowed");
        return;
      }
      setUploadingIndex(index ?? formData.galleryImages.length);
    } else if (section === 'showcase') {
      if (formData.showcaseImages.length >= 2 && index === undefined) {
        toast.error("Maximum 2 showcase images allowed");
        return;
      }
      setUploadingIndex(index ?? formData.showcaseImages.length);
    }

    try {
      const result = await uploadImage(file, 'services');
      if (result?.url) {
        if (section === 'main') {
          setFormData(prev => ({
            ...prev,
            mainImage: result.url
          }));
        } else if (section === 'gallery') {
          if (index !== undefined) {
            // Replace existing image
            setFormData(prev => ({
              ...prev,
              galleryImages: prev.galleryImages.map((img, i) => i === index ? result.url : img)
            }));
          } else {
            // Add new image
            setFormData(prev => ({
              ...prev,
              galleryImages: [...prev.galleryImages, result.url]
            }));
          }
        } else if (section === 'showcase') {
          if (index !== undefined) {
            // Replace existing image
            setFormData(prev => ({
              ...prev,
              showcaseImages: prev.showcaseImages.map((img, i) => i === index ? result.url : img)
            }));
          } else {
            // Add new image
            setFormData(prev => ({
              ...prev,
              showcaseImages: [...prev.showcaseImages, result.url]
            }));
          }
        }
        toast.success("Image uploaded successfully");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingIndex(null);
    }
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
      const requestBody = {
        title: formData.title,
        description: formData.description,
        skills: formData.skills,
        pricing: formData.pricing,
        timeline: formData.timeline,
        location: formData.location,
        mainImage: formData.mainImage,
        galleryImages: formData.galleryImages,
        showcaseImages: formData.showcaseImages
      };

      // Debug: Log skills before sending
      console.log('🔍 Form submit - Skills data:', {
        skills: formData.skills,
        skillsType: typeof formData.skills,
        isArray: Array.isArray(formData.skills),
        skillsLength: Array.isArray(formData.skills) ? formData.skills.length : 0,
        requestBody
      });

      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
      <div className="min-h-[calc(100vh-200px)] bg-gray-50 py-8">
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
                  <CountryCitySelect
                    country={locationCountry}
                    city={locationCity}
                    onCountryChange={(value) => {
                      setLocationCountry(value);
                    }}
                    onCityChange={(value) => {
                      setLocationCity(value);
                    }}
                    placeholder="Select country and city"
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
              {/* Selected Skills */}
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

              {/* Skill Search Dropdown */}
              <div className="relative" ref={skillDropdownRef}>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => {
                      setNewSkill(e.target.value);
                      setSkillQuery(e.target.value);
                      setSkillOpen(true);
                    }}
                    onFocus={() => {
                      if (skillQuery || filteredSkills.length > 0) {
                        setSkillOpen(true);
                      }
                    }}
                    placeholder="Search and add skills..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        // Try to add from filtered results first
                        if (filteredSkills.length > 0) {
                          addSkill(filteredSkills[0].name);
                        } else {
                          addSkillFromInput();
                        }
                      }
                    }}
                  />
                  <Button 
                    type="button" 
                    onClick={addSkillFromInput} 
                    variant="outline"
                    disabled={!newSkill.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Dropdown */}
                {skillOpen && (
                  <div className="absolute z-[9999] top-full left-0 right-0 mt-1 max-h-80 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-xl">
                    {skillsLoading ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        Loading skills...
                      </div>
                    ) : !Array.isArray(filteredSkills) || filteredSkills.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500 text-center">
                        {skillQuery ? "No skills found. Press Enter to add as new skill." : "Start typing to search skills"}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {filteredSkills.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => addSkill(s.name)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm flex items-center justify-between"
                          >
                            <span>{s.name}</span>
                            <Plus className="h-4 w-4 text-gray-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
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
                  placeholder="Paste image URL or upload file"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="main-image-upload"
                  onChange={(e) => {
                    setCurrentImageSection('main');
                    handleFileUpload(e.target.files, 'main');
                    e.target.value = ''; // Reset input
                  }}
                />
                <Button 
                  type="button" 
                  onClick={() => document.getElementById('main-image-upload')?.click()}
                  variant="outline"
                  disabled={isUploading && uploadingIndex === null}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading && uploadingIndex === null ? 'Uploading...' : 'Upload'}
                </Button>
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
                  placeholder="Paste image URL or upload file"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="gallery-image-upload"
                  onChange={(e) => {
                    setCurrentImageSection('gallery');
                    handleFileUpload(e.target.files, 'gallery');
                    e.target.value = ''; // Reset input
                  }}
                />
                <Button 
                  type="button" 
                  onClick={() => document.getElementById('gallery-image-upload')?.click()}
                  variant="outline"
                  disabled={(isUploading && uploadingIndex !== null && uploadingIndex >= 0 && uploadingIndex < formData.galleryImages.length) || formData.galleryImages.length >= 9}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading && uploadingIndex !== null && uploadingIndex >= 0 && uploadingIndex < formData.galleryImages.length ? 'Uploading...' : 'Upload'}
                </Button>
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

              {formData.galleryImages.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-2">No gallery images yet</p>
                  <p className="text-sm text-gray-500 mb-4">Upload images or paste URLs to get started</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="gallery-first-upload"
                    onChange={(e) => {
                      handleFileUpload(e.target.files, 'gallery');
                      e.target.value = ''; // Reset input
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('gallery-first-upload')?.click()}
                    variant="outline"
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload First Image
                  </Button>
                </div>
              ) : (
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
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id={`gallery-replace-${index}`}
                          onChange={(e) => {
                            handleFileUpload(e.target.files, 'gallery', index);
                            e.target.value = ''; // Reset input
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`gallery-replace-${index}`)?.click()}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          disabled={isUploading && uploadingIndex === index}
                        >
                          <Upload className="h-6 w-6 text-white" />
                        </button>
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
                  {/* Add empty slots for upload */}
                  {formData.galleryImages.length < 9 && (
                    <div className="relative">
                      <div className="relative w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="gallery-add-slot"
                          onChange={(e) => {
                            handleFileUpload(e.target.files, 'gallery');
                            e.target.value = ''; // Reset input
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('gallery-add-slot')?.click()}
                          className="p-4 text-gray-400 hover:text-gray-600"
                          disabled={isUploading}
                        >
                          <Upload className="h-8 w-8" />
                        </button>
                      </div>
                    </div>
                  )}
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
                  placeholder="Paste image URL or upload file"
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addImage())}
                />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="showcase-image-upload"
                  onChange={(e) => {
                    setCurrentImageSection('showcase');
                    handleFileUpload(e.target.files, 'showcase');
                    e.target.value = ''; // Reset input
                  }}
                />
                <Button 
                  type="button" 
                  onClick={() => document.getElementById('showcase-image-upload')?.click()}
                  variant="outline"
                  disabled={(isUploading && uploadingIndex !== null && uploadingIndex >= formData.galleryImages.length) || formData.showcaseImages.length >= 2}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploading && uploadingIndex !== null && uploadingIndex >= formData.galleryImages.length ? 'Uploading...' : 'Upload'}
                </Button>
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