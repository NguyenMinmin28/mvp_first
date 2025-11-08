"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import {
  ActionDropdown,
} from "@/ui/components/modern-dropdown";
import { Button } from "@/ui/components/button";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { ChevronDown, MessageSquare } from "lucide-react";
import { Checkbox } from "@/ui/components/checkbox";
import DeveloperReviewModal from "@/features/client/components/developer-review-modal";
import { toast } from "sonner";
import DeveloperReviewsModal from "@/features/client/components/developer-reviews-modal";
import { AvatarCropModal } from "@/features/profile/components/avatar-crop-modal";
import { useImageUpload, useUpload } from "@/core/hooks/use-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/ui/components/tooltip";
import { X, Star, CheckCircle2, User, AlertTriangle, ChevronLeft, ChevronRight, Sparkles, Image as ImageIcon, Lightbulb, Award, MapPin, Mail, DollarSign, Briefcase, Heart, MessageCircle, Bookmark, ArrowRight, Upload, Play, Zap, Camera, Edit } from "lucide-react";
import { cn } from "@/core/utils/utils";
import PortfolioDetailOverlay from "@/features/client/components/PortfolioDetailOverlay";
import { PortfolioModal } from "@/features/onboarding/freelancer/components/portfolio-modal";

interface ProfileSummaryProps {
  profile: any;
  hideControls?: boolean;
  developerId?: string;
  onReviewSubmitted?: () => void;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
}

export default function ProfileSummary({
  profile,
  hideControls = false,
  developerId,
  onReviewSubmitted,
}: ProfileSummaryProps) {
  const router = useRouter();
  const [openEdit, setOpenEdit] = useState(false);
  const [name, setName] = useState<string>(profile?.name || "");
  const [location, setLocation] = useState<string>(profile?.location || "");
  const [experienceYears, setExperienceYears] = useState<number | string>(
    profile?.experienceYears ?? ""
  );
  const [photoUrl, setPhotoUrl] = useState<string>(
    profile?.photoUrl || profile?.image || ""
  );
  // Normalize status for dropdown display: online/offline -> available/not_available
  const normalizeStatusForDisplay = (rawStatus: string): "available" | "not_available" => {
    if (rawStatus === "online" || rawStatus === "available") {
      return "available";
    }
    if (rawStatus === "offline" || rawStatus === "not_available" || rawStatus === "busy") {
      return "not_available";
    }
    return rawStatus === "available" ? "available" : "not_available";
  };

  const [status, setStatus] = useState<string>(
    normalizeStatusForDisplay(profile?.currentStatus || "available")
  );
  const [isSaving, setIsSaving] = useState(false);
  const [age, setAge] = useState<string>((profile as any)?.age || "");
  const [hourlyRate, setHourlyRate] = useState<string>(
    (profile as any)?.hourlyRate?.toString?.() || ""
  );
  const [attachment, setAttachment] = useState<string>(
    Array.isArray((profile as any)?.portfolioLinks)
      ? (profile as any).portfolioLinks[0] || ""
      : ""
  );
  const [allSkills, setAllSkills] = useState<
    Array<{ id: string; name: string; category?: string }>
  >([]);
  const [skillsLoading, setSkillsLoading] = useState<boolean>(false);
  const [skillsSearch, setSkillsSearch] = useState<string>("");
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(
    Array.isArray(profile?.skills)
      ? profile.skills.map((s: any) => s.skillId)
      : []
  );
  const [reviewStats, setReviewStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFavoritedLocal, setIsFavoritedLocal] = useState<boolean>(
    Boolean((profile as any)?.isFavorited)
  );
  const [isFollowingLocal, setIsFollowingLocal] = useState<boolean>(
    Boolean((profile as any)?.isFollowing)
  );
  const [followersCountLocal, setFollowersCountLocal] = useState<number>(
    Number((profile as any)?.followersCount || 0)
  );
  const [showReviewsOverlay, setShowReviewsOverlay] = useState(false);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showAvailabilityConfirm, setShowAvailabilityConfirm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<"available" | "not_available" | null>(null);
  const [userIdeas, setUserIdeas] = useState<any[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const portfolioScrollRef = useRef<HTMLDivElement>(null);
  const ideasScrollRef = useRef<HTMLDivElement>(null);
  const [isPortfolioOverlayOpen, setIsPortfolioOverlayOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<any | null>(null);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<number | null>(null);
  const [currentPortfolioItem, setCurrentPortfolioItem] = useState<any>({
    title: "",
    description: "",
    projectUrl: "",
    imageUrl: "",
    images: [],
  });

  const { uploadImage, isUploading: isUploadingAvatar } = useImageUpload({
    onSuccess: async (result) => {
      setPhotoUrl(result.url);
      // Update profile photoUrl
      try {
        await fetch("/api/user/update-profile", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoUrl: result.url }),
        });
        toast.success("Avatar updated successfully");
        // Reload profile data
        const me = await fetch("/api/user/me", { cache: "no-store" });
        if (me.ok) {
          const data = await me.json();
          setPhotoUrl(data.user?.photoUrl || photoUrl);
        }
        // Dispatch event to update header avatar
        window.dispatchEvent(new CustomEvent('profile-updated'));
      } catch (error) {
        console.error("Failed to save avatar:", error);
      }
    },
    onError: (error) => {
      console.error('Avatar upload error:', error);
    }
  });

  const { deleteFile } = useUpload({
    onSuccess: () => {
      console.log('Old avatar deleted successfully');
    },
    onError: (error) => {
      console.warn('Failed to delete old avatar:', error);
    },
    showToast: false
  });

  const extractPublicId = (url: string | undefined) => {
    if (!url) return undefined;
    try {
      const parts = url.split("/upload/")[1];
      if (!parts) return undefined;
      const path = parts.replace(/^v\d+\//, "");
      const last = path.split(".")[0];
      return last;
    } catch {
      return undefined;
    }
  };

  // Map internal statuses to display labels
  const getDisplayStatus = (value: string) => {
    try {
      if (!value) return "";
      if (value === "available") return "Available";
      if (value === "busy") return "Not Available";
      return value;
    } catch {
      return value;
    }
  };

  // Resolve current presence for dot indicator
  // - For own dashboard (no developerId): reflect login/logout via NextAuth session
  // - For viewing other developer (has developerId): reflect that profile's online/offline
  const { status: authStatus } = useSession();
  const isOnline = developerId
    ? ((profile?.currentStatus as string) || "offline") === "online"
    : authStatus === "authenticated";

  // Sync local state with profile prop changes
  useEffect(() => {
    setIsFollowingLocal(Boolean(profile?.isFollowing));
    setIsFavoritedLocal(Boolean(profile?.isFavorited));
    setFollowersCountLocal(Number(profile?.followersCount || 0));
  }, [profile?.isFollowing, profile?.isFavorited, profile?.followersCount]);

  // Function to render star rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }

    return stars;
  };

  // Fetch review statistics
  const fetchReviewStats = async () => {
    try {
      // If developerId is provided, fetch stats for that specific developer
      // Otherwise, fetch stats for current user
      const endpoint = developerId
        ? `/api/developer/${developerId}/review-stats`
        : "/api/user/review-stats";

      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setReviewStats(data);
      }
    } catch (error) {
      console.error("Error fetching review stats:", error);
    }
  };

  // Handle review submission and refresh stats
  const handleReviewSubmitted = () => {
    // Refresh review statistics
    fetchReviewStats();
    // Notify parent component if callback provided
    if (onReviewSubmitted) {
      onReviewSubmitted();
    }
  };

  const persistStatus = async (statusToPersist: "available" | "not_available") => {
    try {
      // Update local state for display
      setStatus(statusToPersist);

      // Check if user is currently logged in (online)
      // If profile.currentStatus is "online", we should preserve that when submitting
      // But since we only have one status field, we'll just submit the new status
      // The backend/login system will handle setting it back to "online" if user is logged in
      const currentRawStatus = profile?.currentStatus || status;
      const statusToSubmit = currentRawStatus === "online"
        ? statusToPersist // If was online, submit the new available/not_available status
        : statusToPersist; // Otherwise just submit the new status

      await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus: statusToSubmit }),
      });
      try {
        const logsRaw = localStorage.getItem("presenceLogs");
        const logs = logsRaw ? JSON.parse(logsRaw) : [];
        const next = Array.isArray(logs) ? logs : [];
        next.unshift({ status: statusToPersist, at: new Date().toISOString() });
        localStorage.setItem("presenceLogs", JSON.stringify(next.slice(0, 50)));
        window.dispatchEvent(new Event("presence-log-updated"));
      } catch {}
    } catch {}
  };

  const submitStatus = async (newStatus: "available" | "not_available") => {
    if (newStatus === "not_available") {
      setPendingStatus("not_available");
      setShowAvailabilityConfirm(true);
      return;
    }

    await persistStatus(newStatus);
  };

  const handleConfirmAvailability = async () => {
    if (!pendingStatus) {
      setShowAvailabilityConfirm(false);
      return;
    }

    await persistStatus(pendingStatus);
    setPendingStatus(null);
    setShowAvailabilityConfirm(false);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          photoUrl,
          experienceYears: Number(experienceYears) || 0,
          location,
          // These may be ignored by backend if not supported; harmless to send
          age,
          hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
          portfolioLinks: attachment ? [attachment] : undefined,
          skillIds: selectedSkillIds,
        }),
      });
      if (res.ok) {
        // Reload minimal user data used in this card
        const me = await fetch("/api/user/me", { cache: "no-store" });
        if (me.ok) {
          const data = await me.json();
          // update fields locally so UI reflects immediately
          setName(data.user?.name || name);
          setPhotoUrl(data.user?.photoUrl || photoUrl);
          setLocation(data.user?.location || location);
          setAge((data.user as any)?.age || age);
          setExperienceYears(
            ((data.user as any)?.experienceYears ?? experienceYears) as any
          );
          setHourlyRate(((data.user as any)?.hourlyRate ?? hourlyRate) as any);
          setAttachment((data.user as any)?.portfolioLinks?.[0] || attachment);
          if (Array.isArray((data.user as any)?.skills)) {
            setSelectedSkillIds(
              (data.user as any).skills.map((s: any) => s.skillId)
            );
          }
        }
        setOpenEdit(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch review stats on component mount and when developerId changes
  useEffect(() => {
    fetchReviewStats();
  }, [developerId]);

  // Fetch user ideas
  useEffect(() => {
    const fetchIdeas = async () => {
      if (!profile?.id && !developerId) {
        setIdeasLoading(false);
        return;
      }

      try {
        setIdeasLoading(true);
        // Fetch own ideas or developer's ideas
        const endpoint = developerId 
          ? `/api/developer/${developerId}/ideas`
          : `/api/user/my-ideas?limit=10`;
        
        const response = await fetch(endpoint, { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          setUserIdeas(data.ideas || []);
        }
      } catch (error) {
        console.error("Error fetching ideas:", error);
      } finally {
        setIdeasLoading(false);
      }
    };

    fetchIdeas();
  }, [profile?.id, developerId]);


  useEffect(() => {
    if (!openEdit) return;
    let active = true;
    const fetchSkills = async () => {
      try {
        setSkillsLoading(true);
        const qs = skillsSearch
          ? `?search=${encodeURIComponent(skillsSearch)}`
          : "";
        const resp = await fetch(`/api/skills${qs}`, { cache: "no-store" });
        if (!resp.ok) return;
        const data = await resp.json();
        if (active) setAllSkills(Array.isArray(data.skills) ? data.skills : []);
      } finally {
        setSkillsLoading(false);
      }
    };
    fetchSkills();
    return () => {
      active = false;
    };
  }, [openEdit, skillsSearch]);

  const filteredSkills = useMemo(() => {
    if (!skillsSearch) return allSkills;
    const q = skillsSearch.toLowerCase();
    return allSkills.filter((s) => s.name.toLowerCase().includes(q));
  }, [allSkills, skillsSearch]);

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const displaySkillNames = useMemo(() => {
    if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
      return profile.skills.map((s: any) => s.skillName);
    }
    if (selectedSkillIds.length > 0 && allSkills.length > 0) {
      return selectedSkillIds
        .map((id) => allSkills.find((s) => s.id === id)?.name)
        .filter(Boolean) as string[];
    }
    return [] as string[];
  }, [profile?.skills, selectedSkillIds, allSkills]);
  // Get role/title from skills or use a default
  const getRoleTitle = () => {
    if (displaySkillNames.length > 0) {
      // Try to find UI/UX or Graphics related skills
      const uiSkills = displaySkillNames.filter((s: string) => 
        s.toLowerCase().includes('ui') || 
        s.toLowerCase().includes('ux') || 
        s.toLowerCase().includes('graphic') ||
        s.toLowerCase().includes('design')
      );
      if (uiSkills.length > 0) {
        return `Graphic & UI/UX Designer`;
      }
      return displaySkillNames.slice(0, 2).join(" & ") || "Developer";
    }
    return "Developer";
  };

  // Determine if available (for the green Available button)
  const isAvailable = normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "available" && isOnline;


  return (
    <>
      <Card className="border border-gray-200 bg-white shadow-sm rounded-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
            {/* Column 1: Avatar + Profile Info */}
            <div>
              <div className="flex flex-col gap-6 items-center">
                {/* Avatar Section */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex justify-center">
              <TooltipProvider>
                <div className="relative inline-block group">
                  {!developerId ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          disabled={isUploadingAvatar}
                          onClick={() => fileInputRef.current?.click()}
                          className="relative cursor-pointer"
                        >
                          <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 relative">
                            <AvatarImage
                              src={
                                photoUrl ||
                                profile?.photoUrl ||
                                profile?.image ||
                                "/images/avata/default.jpeg"
                              }
                              className="object-cover w-full h-full rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                              }}
                            />
                            <AvatarFallback className="bg-gray-200 w-full h-full flex items-center justify-center rounded-full">
                              <img 
                                src="/images/avata/default.jpeg" 
                                alt="Default Avatar"
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            </AvatarFallback>
                          </Avatar>
                          {/* Delete button on hover - top left corner */}
                          {photoUrl && !isUploadingAvatar && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const oldPublicId = extractPublicId(photoUrl);
                                if (oldPublicId) {
                                  deleteFile(oldPublicId).catch(console.warn);
                                }
                                setPhotoUrl("");
                                fetch("/api/user/update-profile", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ photoUrl: "" }),
                                }).catch(console.error);
                              }}
                              className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                              title="Remove photo"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to upload a photo. For best results, use a square image (1:1).</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Avatar className="w-32 h-32 md:w-40 md:h-40 rounded-full shrink-0 relative">
                      <AvatarImage
                        src={
                          photoUrl ||
                          profile?.photoUrl ||
                          profile?.image ||
                          "/images/avata/default.jpeg"
                        }
                        className="object-cover w-full h-full rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                        }}
                      />
                      <AvatarFallback className="bg-gray-200 w-full h-full flex items-center justify-center rounded-full">
                        <img 
                          src="/images/avata/default.jpeg" 
                          alt="Default Avatar"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {/* Online Status Indicator - positioned at top right */}
                  <span
                    className={`absolute top-0 right-0 inline-block w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white ${
                      isOnline
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                    style={{ zIndex: 30 }}
                    aria-label={
                      isOnline
                        ? "Online"
                        : "Offline"
                    }
                    title={
                      isOnline
                        ? "Online"
                        : "Offline"
                    }
                  />
                  {/* Hidden file input */}
                  {!developerId && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (!file.type.startsWith("image/")) {
                            toast.error("Please select an image file");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                            return;
                          }
                          
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Image size must be less than 5MB");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                            return;
                          }
                          
                          const reader = new FileReader();
                          reader.onload = () => {
                            setImageToCrop(reader.result as string);
                            setCropModalOpen(true);
                          };
                          reader.onerror = () => {
                            toast.error("Failed to read image file");
                          };
                          reader.readAsDataURL(file);
                          
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                      <AvatarCropModal
                        open={cropModalOpen}
                        onClose={() => {
                          setCropModalOpen(false);
                          setImageToCrop("");
                        }}
                        imageSrc={imageToCrop}
                        onCropComplete={async (croppedImageBlob) => {
                          try {
                            const file = new File(
                              [croppedImageBlob],
                              `avatar-${Date.now()}.png`,
                              { type: "image/png" }
                            );
                            
                            const oldPublicId = extractPublicId(photoUrl);
                            if (oldPublicId) {
                              await deleteFile(oldPublicId);
                            }

                            await uploadImage(file, "avatars", 5);
                            
                            setCropModalOpen(false);
                            setImageToCrop("");
                          } catch (err: any) {
                            console.error("Upload error:", err);
                            toast.error(err?.message || "Failed to upload avatar");
                          }
                        }}
                        isUploading={isUploadingAvatar}
                      />
                    </>
                  )}
                </div>
              </TooltipProvider>
            </div>
                  {/* Avatar Upload Encouragement */}
                  {!developerId && (!photoUrl && !profile?.photoUrl && !profile?.image) && (
                    <div className="w-full max-w-xs bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-3 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1.5">
                        <Camera className="w-4 h-4 text-blue-600" />
                        <p className="text-xs font-semibold text-blue-900">Upload your photo</p>
                      </div>
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        Add a profile picture to help clients recognize you
                      </p>
                    </div>
                  )}
            </div>

                {/* Profile Header */}
                <div className="w-full">
                  {/* Name and Verified Badge */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2.5 mb-3 flex-wrap justify-center">
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                        {name || profile?.name || "Developer"}
                      </h2>
                      {profile?.adminApprovalStatus === "approved" && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-50 border border-green-200">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Verified</span>
                        </div>
                      )}
                    </div>

                    {/* Role/Title */}
                    <div className="flex items-center gap-2 mb-4 justify-center">
                      <div className="p-1.5 rounded-lg bg-gray-100">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                      <span className="text-sm font-medium text-gray-700">{getRoleTitle()}</span>
                  </div>
                  
                    {/* Status and Actions */}
                    {!hideControls && !developerId && (
                      <div className="flex items-center gap-2.5 mb-4 justify-center">
                        {/* Status Toggle Switch */}
                        <button
                          type="button"
                          onClick={() => {
                            const currentStatus = normalizeStatusForDisplay(status || profile?.currentStatus || "available");
                            const newStatus = currentStatus === "available" ? "not_available" : "available";
                            submitStatus(newStatus);
                          }}
                          className="group relative inline-flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all duration-300"
                          role="switch"
                          aria-checked={normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "not_available"}
                        >
                          {/* Toggle Track */}
                          <div
                            className={cn(
                              "relative h-8 rounded-full transition-all duration-300 ease-in-out overflow-hidden",
                              "group-hover:scale-105",
                              normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "available"
                                ? "bg-green-500 group-hover:bg-green-600"
                                : "bg-gray-400 group-hover:bg-gray-500"
                            )}
                            style={{ minWidth: "140px", paddingRight: "8px", paddingLeft: "8px" }}
                          >
                            {/* Text Label */}
                            <span
                              className={cn(
                                "absolute top-1/2 -translate-y-1/2 text-sm font-medium transition-all duration-300 whitespace-nowrap text-white",
                                normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "available"
                                  ? "left-10"
                                  : "left-3"
                              )}
                            >
                              {normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "available"
                                ? "Available"
                                : "Not Available"}
                            </span>
                            
                            {/* Toggle Thumb */}
                            <div
                              className={cn(
                                "absolute top-1 w-6 h-6 rounded-full transition-all duration-300 ease-in-out",
                                "shadow-md transform bg-white group-hover:bg-gray-50",
                                normalizeStatusForDisplay(status || profile?.currentStatus || "available") === "available"
                                  ? "left-1"
                                  : "right-1"
                              )}
                            />
                    </div>
                        </button>
                        <ActionDropdown
                          onEditProfile={() => router.push("/profile")}
                        />
                      </div>
                    )}

                    {/* Action Buttons: WhatsApp and Available (for viewing other developers) */}
                  {developerId && (
                      <div className="flex items-center gap-3 mb-4 justify-center">
                      {/* WhatsApp Button */}
                      {profile?.whatsappNumber && (
                        <Button
                          asChild
                          className="h-10 pl-3 pr-4 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg flex items-center gap-3 shadow-sm"
                        >
                          <a
                            href={`https://wa.me/${String(profile.whatsappNumber).replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            title={`WhatsApp: ${profile.whatsappNumber}`}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
                              <svg className="h-4 w-4 text-[#25D366]" viewBox="0 0 32 32" aria-hidden="true" fill="currentColor">
                                <path d="M16 2.667C8.64 2.667 2.667 8.64 2.667 16c0 2.31.597 4.49 1.64 6.4L2 30l7.81-2.273A13.22 13.22 0 0016 29.333c7.36 0 13.333-5.973 13.333-13.333S23.36 2.667 16 2.667Zm7.68 18.386c-.32.91-1.58 1.663-2.563 1.853-.675.133-1.547.24-2.667-.16-4.693-1.6-7.72-5.707-7.96-5.973-.24-.267-1.92-2.56-1.92-4.907 0-2.347 1.2-3.52 1.627-3.987.427-.48.96-.613 1.28-.613.32 0 .64.013.907.027.293.013.72-.133 1.12.853.427 1.013 1.307 3.253 1.413 3.48.107.227.187.507.027.8-.16.293-.24.48-.48.747-.24.267-.48.587-.213 1.067.267.48 1.307 2.16 2.8 3.52 1.933 1.733 3.56 2.293 4.107 2.507.547.213.853.187 1.147-.12.293-.307 1.307-1.52 1.653-2 .347-.48.693-.4 1.173-.24.48.16 2.987 1.413 3.493 1.653.507.24.867.373.973.587.107.213.107 1.28-.213 2.187Z" />
                              </svg>
                            </span>
                            WhatsApp
                          </a>
                        </Button>
                      )}
                      {/* Available Button */}
                      <Button
                        className={`h-10 px-4 rounded-lg ${
                          isAvailable
                            ? "bg-green-500 hover:bg-green-600 text-white"
                            : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                        disabled
                      >
                        {isAvailable ? "Available" : "Not Available"}
                      </Button>
                    </div>
                  )}
                  </div>

                  {/* Profile Details - Clean Professional Layout */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm w-full">
                    <div className="space-y-5">
                      {/* Contact Information */}
                      <div className="space-y-4 pb-5 border-b border-gray-200">
                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Location</div>
                          <div className="text-base font-semibold text-gray-900 leading-tight">{profile?.location || "N/A"}</div>
                    </div>

                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Email</div>
                          <div className="text-base font-semibold text-gray-900 break-all leading-tight">
                            {profile?.email ? (
                              profile.email
                            ) : profile?.isConnected === false ? (
                              <span className="text-gray-500 italic">Hidden</span>
                            ) : (
                              "N/A"
                  )}
                </div>
              </div>
                </div>

                      {/* Professional Stats */}
                      <div className="grid grid-cols-2 gap-4 pb-5 border-b border-gray-200">
                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Age</div>
                          <div className="text-base font-semibold text-gray-900 leading-tight">
                    {(profile as any)?.age ? `${(profile as any).age} years` : "N/A"}
                          </div>
                </div>

                        {profile?.adminApprovalStatus === "approved" && (
                          <div className="text-center">
                            <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Score</div>
                            <div className="text-base font-semibold text-gray-900 leading-tight">70</div>
                          </div>
                        )}
                </div>

                      {/* Financial & Work Info */}
                      <div className="space-y-4 pb-5 border-b border-gray-200">
                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Hourly Rate</div>
                          <div className="text-base font-semibold text-gray-900 leading-tight">
                            {(profile as any)?.hourlyRate ? `$${(profile as any).hourlyRate}/hr` : "N/A"}
                          </div>
                </div>

                        <div className="text-center">
                          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Availability</div>
                          <div className="text-base font-semibold text-gray-900 leading-tight">Part time / Full time</div>
                        </div>
                      </div>

                      {/* Skills Section */}
                      <div className="pb-5 border-b border-gray-200">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-3 text-center">Skills</div>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {displaySkillNames.length > 0 ? (
                            displaySkillNames.map((skill: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 rounded-md bg-gray-50 text-gray-700 text-xs font-medium border border-gray-200"
                              >
                                {skill}
                  </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs italic">No skills added</span>
                          )}
                        </div>
                </div>

                      {/* Reviews Section */}
                      <div className="text-center">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">Reviews</div>
                        <div className="flex items-center justify-center gap-2">
                          <div className="flex items-center gap-0.5">
                      {renderStars(reviewStats.averageRating)}
                    </div>
                    <button
                      type="button"
                            className="text-xs font-semibold text-gray-700 hover:text-blue-600 hover:underline transition-colors"
                      onClick={() => developerId && setShowReviewsOverlay(true)}
                    >
                      ({reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""})
                    </button>
                  </div>
                </div>
                </div>
                  </div>
                </div>
              </div>
                </div>

            {/* Column 2: Portfolio + IdeaSpark */}
            <div className="flex flex-col gap-6">
              {/* Check if both Portfolio and Ideas are empty - only show encouragement for own profile */}
              {!developerId && (!Array.isArray(profile?.portfolioLinks) || profile.portfolioLinks.length === 0) && 
               (!Array.isArray(profile?.portfolioItems) || profile.portfolioItems.length === 0) &&
               !ideasLoading && userIdeas.length === 0 ? (
                  <div className="w-full bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center">
                    {/* Media Icons */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                      <div className="relative">
                        <div className="w-16 h-12 bg-white rounded-lg shadow-sm border border-gray-200 transform rotate-[-8deg]"></div>
                        <div className="w-16 h-12 bg-white rounded-lg shadow-sm border border-gray-200 absolute top-0 left-0 transform rotate-[4deg]"></div>
                        <div className="w-16 h-12 bg-white rounded-lg shadow-sm border border-gray-200 absolute top-0 left-0 transform rotate-[-2deg]"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="p-2 rounded-lg bg-gray-100 border border-gray-200">
                          <Play className="w-5 h-5 text-gray-700" />
                        </div>
                      </div>
                </div>

                    {/* Main CTA */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Drag and drop media, or <a href="/profile" className="underline text-blue-600 hover:text-blue-700">browse</a>
                    </h3>

                    {/* Instructions */}
                    <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                      Choose an image (png, jpg, gif) or video (mp4) in a 4:3, 4:5, 9:16, or 16:9 aspect ratio.
                    </p>

                    {/* Requirements */}
                    <p className="text-xs text-gray-500 mb-6">
                      Min 1600 x 1200. Max 10MB (images), 20MB (videos).
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentPortfolioItem({
                            title: "",
                            description: "",
                            projectUrl: "",
                            imageUrl: "",
                            images: [],
                          });
                          setEditingPortfolioIndex(null);
                          setIsPortfolioModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Add Portfolio</span>
                      </button>
                      <a
                        href="/ideas"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium transition-colors shadow-sm"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Create Idea</span>
                      </a>
                  </div>
                </div>
                ) : (
                  <>
                    {/* Portfolio Section */}
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <ImageIcon className="w-5 h-5 text-gray-700" />
                        <h3 className="text-lg font-bold text-gray-900">Portfolio</h3>
                      </div>
                    {((Array.isArray(profile?.portfolioLinks) && profile.portfolioLinks.length > 0) ||
                      (Array.isArray(profile?.portfolioItems) && profile.portfolioItems.length > 0)) ? (
                  <div className="relative group">
                    <div
                      ref={portfolioScrollRef}
                      className="flex gap-4 overflow-x-auto scroll-smooth hide-scrollbar pb-2"
                    >
                      {(profile.portfolioLinks || profile.portfolioItems || []).map((portfolio: any, index: number) => (
                        <div
                          key={portfolio.id || index}
                          className="flex-shrink-0 w-full bg-white rounded-xl border border-gray-200/80 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden group/item relative"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPortfolio({
                                ...portfolio,
                                url: portfolio.url || portfolio.projectUrl,
                                images: portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []),
                                developer: {
                                  user: {
                                    name: profile?.name || name,
                                    image: profile?.photoUrl || photoUrl,
                                  },
                                  photoUrl: profile?.photoUrl || photoUrl,
                                  location: profile?.location || location,
                                },
                              });
                              setIsPortfolioOverlayOpen(true);
                            }}
                            className="w-full text-left cursor-pointer"
                          >
                            {portfolio.imageUrl && (
                              <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                                <img
                                  src={portfolio.imageUrl}
                                  alt={portfolio.title || 'Portfolio'}
                                  className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                              </div>
                            )}
                            <div className="p-4">
                              <h4 className="text-base font-bold text-gray-900 line-clamp-1 mb-1.5">
                                {portfolio.title || 'Portfolio Project'}
                              </h4>
                              {portfolio.description && (
                                <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                  {portfolio.description}
                                </p>
                              )}
                              <div className="mt-3 flex items-center gap-1 text-blue-600 text-sm font-medium">
                                <span>View project</span>
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                          {!developerId && (
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Fetch fresh portfolio data from API to ensure we have correct structure
                                try {
                                  const response = await fetch('/api/portfolio');
                                  if (response.ok) {
                                    const data = await response.json();
                                    const portfolios = data.portfolios || [];
                                    // Find portfolio by ID or use index
                                    const portfolioToEdit = portfolios.find((p: any) => p.id === portfolio.id) || portfolios[index];
                                    
                                    if (portfolioToEdit) {
                                      const portfolioData = {
                                        id: portfolioToEdit.id,
                                        title: portfolioToEdit.title || "",
                                        description: portfolioToEdit.description || "",
                                        projectUrl: portfolioToEdit.projectUrl || portfolioToEdit.url || "",
                                        imageUrl: portfolioToEdit.imageUrl || "",
                                        images: portfolioToEdit.images || (portfolioToEdit.imageUrl ? [portfolioToEdit.imageUrl] : []),
                                      };
                                      setCurrentPortfolioItem(portfolioData);
                                      // Find the actual index in the portfolios array
                                      const actualIndex = portfolios.findIndex((p: any) => p.id === portfolio.id);
                                      setEditingPortfolioIndex(actualIndex >= 0 ? actualIndex : index);
                                      setIsPortfolioModalOpen(true);
                                    } else {
                                      // Fallback to using portfolio data from props
                                      const portfolioData = {
                                        id: portfolio.id,
                                        title: portfolio.title || "",
                                        description: portfolio.description || "",
                                        projectUrl: portfolio.projectUrl || portfolio.url || "",
                                        imageUrl: portfolio.imageUrl || "",
                                        images: portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []),
                                      };
                                      setCurrentPortfolioItem(portfolioData);
                                      setEditingPortfolioIndex(index);
                                      setIsPortfolioModalOpen(true);
                                    }
                                  } else {
                                    // Fallback to using portfolio data from props
                                    const portfolioData = {
                                      id: portfolio.id,
                                      title: portfolio.title || "",
                                      description: portfolio.description || "",
                                      projectUrl: portfolio.projectUrl || portfolio.url || "",
                                      imageUrl: portfolio.imageUrl || "",
                                      images: portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []),
                                    };
                                    setCurrentPortfolioItem(portfolioData);
                                    setEditingPortfolioIndex(index);
                                    setIsPortfolioModalOpen(true);
                                  }
                                } catch (error) {
                                  console.error('Error loading portfolio data:', error);
                                  // Fallback to using portfolio data from props
                                  const portfolioData = {
                                    id: portfolio.id,
                                    title: portfolio.title || "",
                                    description: portfolio.description || "",
                                    projectUrl: portfolio.projectUrl || portfolio.url || "",
                                    imageUrl: portfolio.imageUrl || "",
                                    images: portfolio.images || (portfolio.imageUrl ? [portfolio.imageUrl] : []),
                                  };
                                  setCurrentPortfolioItem(portfolioData);
                                  setEditingPortfolioIndex(index);
                                  setIsPortfolioModalOpen(true);
                                }
                              }}
                              className="absolute top-2 right-2 bg-white/90 hover:bg-white border border-gray-300 rounded-lg p-2 shadow-md opacity-0 group-hover/item:opacity-100 transition-opacity z-10"
                              title="Edit portfolio"
                            >
                              <Edit className="w-4 h-4 text-gray-700" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {((profile.portfolioLinks || profile.portfolioItems || []).length > 1) && (
                      <>
                        <button
                          onClick={() => {
                            if (portfolioScrollRef.current) {
                              portfolioScrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
                            }
                          }}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2.5 shadow-lg hover:bg-white hover:shadow-xl transition-all z-10 opacity-0 group-hover:opacity-100"
                          aria-label="Scroll left"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700" />
                        </button>
                        <button
                          onClick={() => {
                            if (portfolioScrollRef.current) {
                              portfolioScrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
                            }
                          }}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2.5 shadow-lg hover:bg-white hover:shadow-xl transition-all z-10 opacity-0 group-hover:opacity-100"
                          aria-label="Scroll right"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700" />
                        </button>
                      </>
                    )}
              </div>
            ) : (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium mb-2">No portfolio yet</p>
                    {!developerId && (
                      <a
                        href="/profile"
                        className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
                      >
                        <span>Add portfolio</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
                    </div>

                    {/* IdeaSpark Section */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-5 h-5 text-gray-900" />
                        <h3 className="text-lg font-bold text-gray-900">IdeaSpark</h3>
                      </div>

                  {ideasLoading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full mx-auto"></div>
                      <p className="text-sm text-gray-500 mt-3">Loading ideas...</p>
                </div>
                  ) : userIdeas.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                      <Zap className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-700 font-medium mb-2">No ideas yet</p>
                      <a
                        href="/ideas"
                        className="inline-flex items-center gap-1.5 text-sm text-gray-900 hover:text-gray-700 font-medium border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                      >
                        <span>Create your first idea</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
              </div>
            ) : (
                    <div className="relative flex-1 group">
                      <div
                        ref={ideasScrollRef}
                        className={`flex gap-3 scroll-smooth hide-scrollbar pb-2 ${
                          userIdeas.length > 3 ? 'overflow-x-auto' : 'overflow-x-hidden'
                        }`}
                        style={{ scrollSnapType: 'x mandatory' }}
                      >
                        {userIdeas.map((idea) => {
                          const imageUrl = idea.coverUrl || (idea.cover?.storageKey ? `/api/files/${idea.cover.storageKey}` : null);
                          return (
                            <a
                              key={idea.id}
                              href={`/ideas/${idea.id}`}
                              className="flex-shrink-0 w-full max-w-[calc(100%-0.75rem)] sm:max-w-[280px] block bg-white rounded-xl border border-gray-200/80 hover:border-gray-400 hover:shadow-lg transition-all duration-300 overflow-hidden group/item"
                              style={{ scrollSnapAlign: 'start' }}
                            >
                              {/* Image Section - Square */}
                              {imageUrl ? (
                                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden relative">
                                  <img
                                    src={imageUrl}
                                    alt={idea.title}
                                    className="w-full h-full object-cover group-hover/item:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                      </div>
                              ) : (
                                <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <Zap className="w-8 h-8 text-gray-400" />
                    </div>
                              )}
                              
                              {/* Content Section */}
                              <div className="p-3">
                                <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1.5 group-hover/item:text-gray-700 transition-colors">
                                  {idea.title}
                    </h4>
                                <p className="text-[11px] text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                                  {idea.summary}
                                </p>
                                <div className="flex items-center gap-2.5 text-[10px] text-gray-500">
                                  {idea._count?.likes > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                                      <span className="font-medium">{idea._count.likes}</span>
                      </div>
                                  )}
                                  {idea._count?.comments > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <MessageCircle className="w-3 h-3 text-blue-500" />
                                      <span className="font-medium">{idea._count.comments}</span>
                    </div>
                                  )}
                                  {idea._count?.bookmarks > 0 && (
                                    <div className="flex items-center gap-0.5">
                                      <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500" />
                                      <span className="font-medium">{idea._count.bookmarks}</span>
                  </div>
                                  )}
                    </div>
                  </div>
                            </a>
                          );
                        })}
                </div>
                      {userIdeas.length > 3 && (
                        <>
                          <button
                            onClick={() => {
                              if (ideasScrollRef.current) {
                                ideasScrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
                              }
                            }}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white hover:shadow-xl transition-all z-10 opacity-0 group-hover:opacity-100"
                            aria-label="Scroll left"
                          >
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          <button
                            onClick={() => {
                              if (ideasScrollRef.current) {
                                ideasScrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
                              }
                            }}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:bg-white hover:shadow-xl transition-all z-10 opacity-0 group-hover:opacity-100"
                            aria-label="Scroll right"
                          >
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                        </>
            )}
                    </div>
                  )}
                    </div>
                  </>
                )}
            </div>
          </div>

        </CardContent>
        {/* Reviews overlay modal */}
        {showReviewsOverlay && developerId && (
          <DeveloperReviewsModal
            isOpen={showReviewsOverlay}
            onClose={() => setShowReviewsOverlay(false)}
            developerId={developerId}
            developerName={name || profile?.name || "Developer"}
          />
        )}
      </Card>

      {/* Portfolio Detail Overlay */}
      <PortfolioDetailOverlay
        isOpen={isPortfolioOverlayOpen}
        item={selectedPortfolio}
        onClose={() => {
          setIsPortfolioOverlayOpen(false);
          setSelectedPortfolio(null);
        }}
      />

      {/* Portfolio Modal */}
      <PortfolioModal
        isOpen={isPortfolioModalOpen}
        onClose={() => {
          setIsPortfolioModalOpen(false);
          setEditingPortfolioIndex(null);
          setCurrentPortfolioItem({
            title: "",
            description: "",
            projectUrl: "",
            imageUrl: "",
            images: [],
          });
        }}
        portfolio={currentPortfolioItem}
        onSave={async (updatedPortfolio) => {
          try {
            // Get current portfolios from API
            const loadResponse = await fetch('/api/portfolio');
            let currentPortfolios: any[] = [];
            
            if (loadResponse.ok) {
              const loadData = await loadResponse.json();
              currentPortfolios = loadData.portfolios || [];
            }
            
            // Use editingPortfolioIndex if editing, otherwise find first empty slot
            let targetIndex: number;
            if (editingPortfolioIndex !== null) {
              // Editing existing portfolio - use the tracked index
              targetIndex = editingPortfolioIndex;
            } else {
              // Adding new portfolio - find first empty slot
              targetIndex = currentPortfolios.length;
              for (let i = 0; i < 6; i++) {
                const existing = currentPortfolios[i];
                if (!existing || (!existing.title && !existing.description && !existing.projectUrl && !existing.imageUrl)) {
                  targetIndex = i;
                  break;
                }
              }
            }
            
            // Ensure we have 6 slots
            const portfolios = Array.from({ length: 6 }, (_, index) => {
              if (index === targetIndex) {
                return {
                  title: updatedPortfolio.title || "",
                  description: updatedPortfolio.description || "",
                  projectUrl: updatedPortfolio.projectUrl || "",
                  imageUrl: updatedPortfolio.imageUrl || "",
                  images: updatedPortfolio.images || (updatedPortfolio.imageUrl ? [updatedPortfolio.imageUrl] : []),
                };
              }
              const existing = currentPortfolios[index];
              return existing ? {
                title: existing.title || "",
                description: existing.description || "",
                projectUrl: existing.projectUrl || existing.url || "",
                imageUrl: existing.imageUrl || "",
                images: existing.images || (existing.imageUrl ? [existing.imageUrl] : []),
              } : {
                title: "",
                description: "",
                projectUrl: "",
                imageUrl: "",
                images: [],
              };
            });
            
            // Save to API
            const response = await fetch('/api/portfolio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ portfolios }),
            });

            if (response.ok) {
              toast.success("Portfolio saved successfully!");
              setIsPortfolioModalOpen(false);
              setEditingPortfolioIndex(null);
              // Reload page to refresh profile data
              window.location.reload();
            } else {
              const errorData = await response.json();
              console.error('Save error:', errorData);
              toast.error("Failed to save portfolio");
            }
          } catch (error) {
            console.error('Error saving portfolio:', error);
            toast.error("Failed to save portfolio");
          }
        }}
        slotIndex={editingPortfolioIndex !== null ? editingPortfolioIndex : (Array.isArray(profile?.portfolioLinks) ? profile.portfolioLinks.length : 0)}
      />
      <Dialog
        open={showAvailabilityConfirm}
        onOpenChange={(open) => {
          setShowAvailabilityConfirm(open);
          if (!open) {
            setPendingStatus(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <div className="flex items-center gap-3 rounded-full bg-orange-100 text-orange-700 px-4 py-2 w-fit">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm font-semibold">Heads up</span>
          </div>
          <DialogHeader className="mt-2">
            <DialogTitle>Pause new project invites?</DialogTitle>
            <DialogDescription>
              When you mark yourself as <span className="font-semibold text-gray-900">Not Available</span>, we immediately stop sending you new project invitations. You can switch back to <span className="font-semibold text-gray-900">Available</span> anytime to resume receiving matches.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
            <p className="font-medium">You will still appear in your existing conversations, but new clients won&apos;t be able to invite you while this status is active.</p>
          </div>
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowAvailabilityConfirm(false);
                setPendingStatus(null);
              }}
            >
              Keep me Available
            </Button>
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handleConfirmAvailability}
            >
              Yes, set Not Available
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-sm mb-1">Full name</div>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <div className="text-sm mb-1">Avatar URL</div>
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://..."
              />
              <div className="mt-2 flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={photoUrl || undefined} />
                  <AvatarFallback>AV</AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm mb-1">Address</div>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm mb-1">Age</div>
                <Input
                  value={(age as any) || ""}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm mb-1">Experience (years)</div>
                <Input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm mb-1">Hourly rate ($)</div>
                <Input
                  type="number"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                />
              </div>
            </div>
            <div>
              <div className="text-sm mb-1">Skills</div>
              <Input
                value={skillsSearch}
                onChange={(e) => setSkillsSearch(e.target.value)}
                placeholder="Search skills..."
              />
              <div className="mt-2 max-h-48 overflow-auto rounded border p-2 space-y-1">
                {skillsLoading ? (
                  <div className="text-xs text-gray-500">Loading...</div>
                ) : filteredSkills.length === 0 ? (
                  <div className="text-xs text-gray-500">No skills found</div>
                ) : (
                  filteredSkills.map((s) => (
                    <label
                      key={s.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={selectedSkillIds.includes(s.id)}
                        onCheckedChange={() => toggleSkill(s.id)}
                      />
                      <span className="flex-1 truncate">{s.name}</span>
                      {s.category ? (
                        <span className="text-xs text-gray-500">
                          {s.category}
                        </span>
                      ) : null}
                    </label>
                  ))
                )}
              </div>
              {selectedSkillIds.length > 0 ? (
                <div className="mt-2 text-sm font-medium">
                  {selectedSkillIds
                    .map((id) => allSkills.find((s) => s.id === id)?.name)
                    .filter(Boolean)
                    .join(", ")}
                </div>
              ) : null}
            </div>
            <div>
              <div className="text-sm mb-1">Attachment URL</div>
              <Input
                value={attachment}
                onChange={(e) => setAttachment(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEdit(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-black text-white"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Developer Review Modal */}
      {showReviewModal && developerId && !hideControls && (
        <DeveloperReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          developerId={developerId}
          developerName={profile?.name || "Developer"}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </>
  );
}

