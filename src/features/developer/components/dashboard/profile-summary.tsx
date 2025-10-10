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
      <Card>
        <CardHeader className="px-4 pt-2 pb-1 md:pl-[320px]">
          {/* Empty header to maintain spacing */}
        </CardHeader>
        <CardContent className="pt-4 px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left: Avatar */}
            <div className="lg:w-[200px] w-full lg:max-w-[200px]">
              <div className="relative inline-block">
                <Avatar className="!w-32 !h-32 sm:!w-36 sm:!h-36 lg:!w-40 lg:!h-40 !rounded-md !shrink-0">
                  <AvatarImage
                    src={
                      photoUrl ||
                      profile?.photoUrl ||
                      profile?.image ||
                      undefined
                    }
                    className="object-cover w-full h-full"
                  />
                  <AvatarFallback className="!text-lg !font-semibold !w-full !h-full !flex !items-center !justify-center !rounded-md !bg-muted">
                    {(name || profile?.name || "").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute right-0 top-0 inline-block w-6 h-6 rounded-full border-2 border-white transform translate-x-1/2 -translate-y-1/2 ${
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
                />
              </div>
            </div>

            {/* Right: Personal info */}
            <div className="flex-1">
              <div className="space-y-2 sm:space-y-3 text-sm">
                {/* Name and Email */}
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">Name: </div>
                  <div className="flex flex-col min-w-0 gap-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm md:text-base leading-tight">
                          {name || profile?.name}
                        </span>
                        {profile?.email && (
                          <span className="text-xs md:text-[13px] text-gray-600 leading-tight">
                            {profile.email}
                          </span>
                        )}
                        {!profile?.email && profile?.isConnected === false && (
                          <span className="text-xs md:text-[13px] text-gray-400 leading-tight italic">
                            Contact information hidden - Connect to view
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                        {!hideControls && !developerId ? (
                          <div className="flex items-center gap-2">
                            <StatusDropdown
                              currentStatus={status || "available"}
                              onStatusChange={(newStatus) =>
                                submitStatus(newStatus as "available" | "busy")
                              }
                            />
                            <ActionDropdown
                              onEditProfile={() => router.push("/profile")}
                            />
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
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Address:{" "}
                  </div>
                  <div className="flex flex-col min-w-0 gap-2">
                    <span className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {profile?.location || ""}
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs sm:text-sm">
                          My review:
                        </span>
                        <div className="flex items-center gap-1">
                          {renderStars(reviewStats.averageRating)}
                        </div>
                        <button
                          type="button"
                          className="text-gray-600 text-xs sm:text-sm hover:underline"
                          onClick={() =>
                            developerId && setShowReviewsOverlay(true)
                          }
                        >
                          ({reviewStats.totalReviews} review
                          {reviewStats.totalReviews !== 1 ? "s" : ""})
                        </button>
                      </div>
                      {!hideControls && developerId && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs w-fit"
                          onClick={() => setShowReviewModal(true)}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">Age: </div>
                  <div className="flex flex-col min-w-0 gap-2">
                    <span className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                      {(profile as any)?.age || ""}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 text-xs sm:text-sm">
                        Hourly rate:
                      </span>
                      <span className="font-bold text-xs sm:text-sm">
                        {(profile as any)?.hourlyRate
                          ? `$${(profile as any).hourlyRate}`
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Email:{" "}
                  </div>
                  <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {profile?.email ? (
                      profile.email
                    ) : profile?.isConnected === false ? (
                      <span className="text-gray-400 italic">
                        Hidden - Connect to view
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Approve:{" "}
                  </div>
                  <div className="font-bold text-xs sm:text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {(profile as any)?.adminApprovalStatus || ""}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-center gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Followers:{" "}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm">
                      {followersCountLocal}
                    </span>
                    {developerId &&
                      (profile as any)?.isFollowing !== undefined && (
                        <span className="text-xs text-gray-500">
                          {profile.isFollowing ? "(You follow)" : ""}
                        </span>
                      )}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Skills:{" "}
                  </div>
                  <div className="font-bold text-xs sm:text-sm break-words">
                    {displaySkillNames.length > 0
                      ? displaySkillNames.join(", ")
                      : ""}
                  </div>
                </div>
                <div className="grid grid-cols-[80px_1fr] sm:grid-cols-[96px_1fr] items-start gap-1.5">
                  <div className="text-gray-500 text-xs sm:text-sm">
                    Attachment:{" "}
                  </div>
                  <div className="font-bold text-xs sm:text-sm break-all">
                    {profile?.resumeUrl ? (
                      <a
                        href={profile.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 text-red-600 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="break-all">
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
                        </span>
                      </a>
                    ) : Array.isArray((profile as any)?.portfolioLinks) &&
                      (profile as any).portfolioLinks.length > 0 ? (
                      <a
                        href={
                          typeof (profile as any).portfolioLinks[0] === 'string' 
                            ? (profile as any).portfolioLinks[0]
                            : (profile as any).portfolioLinks[0]?.url || '#'
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="underline text-blue-600 break-all"
                      >
                        {typeof (profile as any).portfolioLinks[0] === 'string' 
                          ? (profile as any).portfolioLinks[0]
                          : (profile as any).portfolioLinks[0]?.title || (profile as any).portfolioLinks[0]?.url || 'Portfolio Link'
                        }
                      </a>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              </div>
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
      </Card>
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
