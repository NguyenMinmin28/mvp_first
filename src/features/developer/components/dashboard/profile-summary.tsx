"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/ui/components/avatar";
import { Badge } from "@/ui/components/badge";
import {
  StatusDropdown,
  ActionDropdown,
} from "@/ui/components/modern-dropdown";
import { Button } from "@/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/ui/components/dialog";
import { Input } from "@/ui/components/input";
import { ChevronDown, Star, MessageSquare, MessageCircle } from "lucide-react";
import { Checkbox } from "@/ui/components/checkbox";
import DeveloperReviewModal from "@/features/client/components/developer-review-modal";
import { toast } from "sonner";
import DeveloperReviewsModal from "@/features/client/components/developer-reviews-modal";

interface ProfileSummaryProps {
  profile: any;
  hideControls?: boolean;
  developerId?: string;
  onReviewSubmitted?: () => void;
  currentUserRole?: string;
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
  const [status, setStatus] = useState<string>(
    profile?.currentStatus || "available"
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
  const [showResumeViewer, setShowResumeViewer] = useState(false);

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
  const resolvedPresence: "available" | "busy" = (() => {
    const raw =
      (developerId ? (profile?.currentStatus as string) : status) || "busy";
    return raw === "available" ? "available" : "busy";
  })();

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

  const submitStatus = async (newStatus: "available" | "busy") => {
    try {
      setStatus(newStatus);
      await fetch("/api/user/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentStatus: newStatus }),
      });
      try {
        const logsRaw = localStorage.getItem("presenceLogs");
        const logs = logsRaw ? JSON.parse(logsRaw) : [];
        const next = Array.isArray(logs) ? logs : [];
        next.unshift({ status: newStatus, at: new Date().toISOString() });
        localStorage.setItem("presenceLogs", JSON.stringify(next.slice(0, 50)));
        window.dispatchEvent(new Event("presence-log-updated"));
      } catch {}
    } catch {}
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
  return (
    <>
      <div className="relative group z-10">
        {/* Shine overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 rounded-3xl pointer-events-none z-1" />
        
        <Card className="border-2 border-gray-200 hover:border-black shadow-xl hover:shadow-2xl transition-all duration-500 rounded-3xl overflow-hidden bg-white">
          <CardHeader className="px-4 pt-2 pb-1">
            {/* Empty header to maintain spacing */}
          </CardHeader>
          <CardContent className="pt-4 px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-8">
              {/* Left: Avatar - Optimized Size */}
              <div className="lg:w-[200px] w-full lg:max-w-[220px] flex justify-center lg:justify-start">
                <div className="relative inline-block group/avatar">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-black rounded-2xl blur-xl opacity-10 group-hover/avatar:opacity-20 transition-opacity duration-500" />
                  
                  <Avatar className="relative w-32 h-32 sm:w-40 sm:h-40 lg:w-44 lg:h-44 xl:w-48 xl:h-48 rounded-2xl shadow-2xl border-4 border-white group-hover/avatar:scale-[1.02] transition-all duration-500 aspect-square">
                    <AvatarImage
                      src={
                        photoUrl ||
                        profile?.photoUrl ||
                        profile?.image ||
                        undefined
                      }
                      className="object-cover w-full h-full"
                    />
                    <AvatarFallback className="text-2xl sm:text-3xl lg:text-4xl font-black bg-gradient-to-br from-gray-900 to-black text-white w-full h-full flex items-center justify-center">
                      {(name || profile?.name || "").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status Indicator - Enhanced */}
                  <span
                    className={`absolute right-2 top-2 inline-flex items-center justify-center w-8 h-8 rounded-full border-4 border-white shadow-lg animate-pulse ${
                      resolvedPresence === "available"
                        ? "bg-green-500"
                        : "bg-gray-400"
                    }`}
                    aria-label={
                      resolvedPresence === "available"
                        ? "Available"
                        : "Not Available"
                    }
                    title={
                      resolvedPresence === "available"
                        ? "Available"
                        : "Not Available"
                    }
                  >
                    <span className={`w-3 h-3 rounded-full ${
                      resolvedPresence === "available"
                        ? "bg-white"
                        : "bg-gray-600"
                    }`} />
                  </span>
                </div>
              </div>

            {/* Right: Personal info - Premium Typography */}
            <div className="flex-1">
              <div className="space-y-4 sm:space-y-5">
                {/* Name and Email - Enhanced */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Name</div>
                  <div className="flex flex-col min-w-0 gap-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex flex-col min-w-0">
                        <span className="font-black text-lg md:text-xl text-gray-900 leading-tight tracking-tight">
                          {name || profile?.name}
                        </span>
                        {profile?.email && (
                          <span className="text-sm text-gray-600 font-medium leading-tight mt-1 flex items-center gap-1.5">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            {profile.email}
                          </span>
                        )}
                        {!profile?.email && profile?.isConnected === false && (
                          <span className="text-xs text-gray-400 leading-tight italic flex items-center gap-1.5">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Contact information hidden - Connect to view
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                        {!hideControls && !developerId ? (
                          <div className="flex items-center gap-2">
                            <div className="relative group/status">
                              <div className="absolute inset-0 bg-green-500 rounded-full blur-md opacity-0 group-hover/status:opacity-20 transition-opacity duration-300" />
                              <div className="relative">
                                <StatusDropdown
                                  currentStatus={status || "available"}
                                  onStatusChange={(newStatus) =>
                                    submitStatus(newStatus as "available" | "busy")
                                  }
                                />
                              </div>
                            </div>
                            <div className="relative group/action">
                              <div className="absolute inset-0 bg-black rounded-full blur-md opacity-0 group-hover/action:opacity-20 transition-opacity duration-300" />
                              <div className="relative">
                                <ActionDropdown
                                  onEditProfile={() => router.push("/profile")}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            {/* Hide status pill on public developer page */}
                            {!developerId && (
                              <Badge
                                className={`h-8 px-3 text-xs hover:bg-current hover:text-current ${
                                  (status ||
                                    profile?.currentStatus ||
                                    "available") === "available"
                                    ? "bg-green-100 text-green-800 border-green-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                                }`}
                              >
                                {getDisplayStatus(
                                  status ||
                                    profile?.currentStatus ||
                                    "available"
                                )}
                              </Badge>
                            )}
                            {profile?.adminApprovalStatus && (
                              <Badge
                                className={`h-8 px-3 text-xs hover:text-current ${
                                  profile.adminApprovalStatus === "approved"
                                    ? "bg-green-100 text-green-800 border-green-200 hover:bg-green-50"
                                    : profile.adminApprovalStatus === "pending"
                                      ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-50"
                                      : profile.adminApprovalStatus ===
                                          "rejected"
                                        ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-50"
                                        : "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-50"
                                }`}
                              >
                                {String(
                                  profile.adminApprovalStatus
                                ).toLowerCase()}
                              </Badge>
                            )}
                            {developerId && (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                                {!profile?.isConnected &&
                                (isFavoritedLocal || profile?.isFavorited) &&
                                profile?.whatsappNumber ? (
                                  <Button
                                    asChild
                                    className="h-8 px-3 bg-black text-white hover:bg-gray-800 rounded-full flex items-center gap-2 w-full sm:w-auto"
                                  >
                                    <a
                                      href={`https://wa.me/${String(profile.whatsappNumber).replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      title={`WhatsApp: ${profile.whatsappNumber}`}
                                    >
                                      <MessageCircle className="w-4 h-4" />
                                      WhatsApp
                                    </a>
                                  </Button>
                                ) : null}

                                <Button
                                  className={`h-8 px-3 rounded-full w-full sm:w-auto ${
                                    isFollowingLocal || profile?.isFollowing
                                      ? "bg-gray-200 text-gray-800 hover:bg-gray-300"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                  onClick={() => {
                                    const action =
                                      isFollowingLocal || profile?.isFollowing
                                        ? "unfollow"
                                        : "follow";
                                    const message =
                                      action === "follow"
                                        ? `Following ${profile?.name || "freelancer"} - you'll get updates about their portfolio, reviews, and ideas!`
                                        : `Unfollowed ${profile?.name || "freelancer"}`;

                                    // Optimistic update: toggle and adjust follower count immediately
                                    setIsFollowingLocal(action === "follow");
                                    setFollowersCountLocal((prev) =>
                                      Math.max(
                                        0,
                                        prev + (action === "follow" ? 1 : -1)
                                      )
                                    );
                                    toast.success(message);

                                    try {
                                      const payload = JSON.stringify({
                                        developerId: profile?.userId,
                                        action: action,
                                      });
                                      if (
                                        typeof navigator !== "undefined" &&
                                        typeof navigator.sendBeacon ===
                                          "function"
                                      ) {
                                        const blob = new Blob([payload], {
                                          type: "application/json",
                                        });
                                        navigator.sendBeacon(
                                          "/api/user/follow",
                                          blob
                                        );
                                      } else {
                                        fetch("/api/user/follow", {
                                          method: "POST",
                                          headers: {
                                            "Content-Type": "application/json",
                                          },
                                          body: payload,
                                          keepalive: true,
                                        }).catch(() => {});
                                      }
                                    } catch {}
                                  }}
                                >
                                  {isFollowingLocal || profile?.isFollowing
                                    ? "Unfollow"
                                    : "Follow"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address & Reviews - Premium Card */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Location</div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="font-bold text-sm text-gray-900">
                        {profile?.location || "Not specified"}
                      </span>
                    </div>
                    
                    {/* Reviews Section */}
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-3 shadow-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Rating</span>
                          <div className="flex items-center gap-1">
                            {renderStars(reviewStats.averageRating)}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors text-left flex items-center gap-1.5 group"
                          onClick={() => developerId && setShowReviewsOverlay(true)}
                        >
                          <svg className="w-3.5 h-3.5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {reviewStats.totalReviews} review{reviewStats.totalReviews !== 1 ? "s" : ""}
                          <svg className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {!hideControls && developerId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs w-full bg-white hover:bg-gray-50 border-yellow-300 hover:border-yellow-400 shadow-sm font-bold"
                            onClick={() => setShowReviewModal(true)}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            Write Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Age & Rate - Side by Side Pills */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Details</div>
                  <div className="flex flex-wrap gap-2">
                    {(profile as any)?.age && (
                      <div className="px-4 py-2.5 bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs font-bold text-gray-500 uppercase">Age</span>
                          <span className="text-sm font-black text-gray-900">{(profile as any).age}</span>
                        </div>
                      </div>
                    )}
                    {(profile as any)?.hourlyRate && (
                      <div className="px-4 py-2.5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl shadow-sm hover:shadow-md hover:border-green-300 transition-all duration-300 group">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs font-bold text-green-700 uppercase">Rate</span>
                          <span className="text-sm font-black text-green-900">${(profile as any).hourlyRate}/hr</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badges - Approval & Followers */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Status</div>
                  <div className="flex flex-wrap gap-2">
                    {(profile as any)?.adminApprovalStatus && (
                      <div className={`px-4 py-2 rounded-xl border-2 shadow-sm font-bold text-sm ${
                        (profile as any).adminApprovalStatus === "approved" 
                          ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 text-green-900"
                          : (profile as any).adminApprovalStatus === "pending"
                          ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 text-yellow-900"
                          : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200 text-red-900"
                      }`}>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            {(profile as any).adminApprovalStatus === "approved" ? (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            ) : (
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            )}
                          </svg>
                          <span className="uppercase text-xs tracking-wide">
                            {String((profile as any).adminApprovalStatus)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm font-bold text-sm text-blue-900">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                        </svg>
                        <span className="text-xs uppercase tracking-wide">Followers</span>
                        <span className="font-black">{followersCountLocal}</span>
                        {developerId && (profile as any)?.isFollowing && (
                          <span className="text-xs opacity-75">(Following)</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills - Premium Pills */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {displaySkillNames.length > 0 ? (
                      displaySkillNames.map((skill: string, idx: number) => (
                        <div 
                          key={idx}
                          className="px-3 py-1.5 bg-gradient-to-br from-gray-900 to-black text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 group"
                        >
                          <div className="flex items-center gap-1.5">
                            <svg className="w-3 h-3 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span className="text-xs font-bold">{skill}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No skills specified</span>
                    )}
                  </div>
                </div>

                {/* Attachment - Premium Document Card */}
                <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[120px_1fr] items-start gap-3">
                  <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">Resume</div>
                  <div>
                    {profile?.resumeUrl ? (
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block"
                      >
                        <div className="relative overflow-hidden">
                          <div className="absolute inset-0 bg-red-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          <div className="relative bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 shadow-sm hover:shadow-md group-hover:border-red-300 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-red-700 uppercase tracking-wide mb-0.5">Resume / CV</div>
                                <div className="text-sm font-black text-red-900 truncate">
                                  {(() => {
                                    try {
                                      const url = String(profile.resumeUrl);
                                      const name = decodeURIComponent(
                                        url.split("/").pop() || "resume.pdf"
                                      );
                                      return name.split("?")[0];
                                    } catch {
                                      return "resume.pdf";
                                    }
                                  })()}
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                    ) : Array.isArray((profile as any)?.portfolioLinks) && (profile as any).portfolioLinks.length > 0 ? (
                      <a
                        href={(profile as any).portfolioLinks[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="group block"
                      >
                        <div className="relative overflow-hidden">
                          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                          <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm hover:shadow-md group-hover:border-blue-300 transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-0.5">Portfolio Link</div>
                                <div className="text-sm font-bold text-blue-900 truncate">
                                  {(profile as any).portfolioLinks[0]}
                                </div>
                              </div>
                              <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </a>
                    ) : (
                      <div className="text-sm text-gray-500 italic px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl">
                        No portfolio attached
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Reviews overlay modal */}
      {showReviewsOverlay && developerId && (
          <DeveloperReviewsModal
            isOpen={showReviewsOverlay}
            onClose={() => setShowReviewsOverlay(false)}
            developerId={developerId}
            developerName={name || profile?.name || "Developer"}
          />
        )}
        {/* Resume viewer modal */}
        {showResumeViewer && profile?.resumeUrl && (
          <Dialog open={showResumeViewer} onOpenChange={setShowResumeViewer}>
            <DialogContent className="max-w-4xl w-[95vw] h-[85vh] p-0 overflow-hidden">
              <DialogHeader className="px-4 pt-4 pb-2">
                <DialogTitle>Attachment Preview</DialogTitle>
              </DialogHeader>
              <div className="px-4 pb-4 h-[calc(85vh-56px)]">
                {(() => {
                  const url = String(profile.resumeUrl);
                  const lower = url.toLowerCase();
                  const isPdf =
                    lower.endsWith(".pdf") || lower.includes("/pdf");
                  const viewer = isPdf
                    ? `${url}#toolbar=1&zoom=page-width`
                    : `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(url)}`;
                  return (
                    <iframe
                      src={viewer}
                      className="w-full h-full border-0"
                      referrerPolicy="no-referrer"
                    />
                  );
                })()}
              </div>
              <DialogFooter className="px-4 pb-4">
                {(() => {
                  try {
                    const url = String(profile.resumeUrl);
                    return (
                      <a
                        href={url}
                        className="text-sm underline text-blue-600"
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open in new tab
                      </a>
                    );
                  } catch {
                    return null;
                  }
                })()}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      
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
