"use client";

import { Info, Share, X, Heart } from "lucide-react";
import { useEffect, useState } from "react";

interface PortfolioDetailOverlayProps {
  isOpen: boolean;
  item: any | null;
  onClose: () => void;
}

export default function PortfolioDetailOverlay({ isOpen, item, onClose }: PortfolioDetailOverlayProps) {
  const [copied, setCopied] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [pop, setPop] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(Math.max(1, Math.round(85 / 40)));
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [today, setToday] = useState("");
  const [timelineStart, setTimelineStart] = useState("");
  const [timelineEnd, setTimelineEnd] = useState("");
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      const scrollY = window.scrollY;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      if (isOpen) {
        const scrollY = document.body.style.top;
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        if (scrollY) window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    // initialize display-only counters/timeline
    const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
    const now = new Date();
    setToday(now.toLocaleDateString(undefined, fmt));
    setTimelineStart(now.toLocaleDateString(undefined, fmt));
    const end = new Date(Date.now() + 14 * 24 * 3600 * 1000);
    setTimelineEnd(end.toLocaleDateString(undefined, fmt));
    // reset details/like when item changes
    setIsDetailsOpen(false);
    setIsLiked(false);
    setLikeCount(Math.max(1, Math.round(85 / 40)));
  }, [item?.title]);

  const handleShare = async () => {
    const url = item?.url || (typeof window !== "undefined" ? window.location.href : "");
    try {
      if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // ignore
    } finally {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  const handleHeartClick = () => {
    // Local only like toggle (no API for portfolio)
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => Math.max(0, c + (next ? 1 : -1)));
    if (next) {
      setPop(true);
      setTimeout(() => setPop(false), 500);
    }
  };

  // Prefer highest quality display using Cloudinary transformations when possible
  const getOptimizedImageUrl = (url?: string, width?: number, height?: number) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      if (!u.hostname.includes("res.cloudinary.com")) return url; // only transform cloudinary
      const parts = u.pathname.split("/upload/");
      if (parts.length !== 2) return url;
      const transform = ["f_auto", "q_auto" ];
      if (width) transform.push(`w_${width}`);
      if (height) transform.push(`h_${height}`);
      // crop fill to cover
      if (width || height) transform.push("c_fill");
      u.pathname = `${parts[0]}/upload/${transform.join(',')}/${parts[1]}`;
      return u.toString();
    } catch {
      return url;
    }
  };

  const bestPortfolioImage = (() => {
    const imgs: string[] = Array.isArray(item?.images) ? item.images : [];
    const nonEmpty = imgs.filter((s) => s && typeof s === 'string' && s.trim() !== "");
    return nonEmpty[0] || item?.imageUrl || "";
  })();

  return (
    <div className={`fixed inset-0 z-[100] pointer-events-${isOpen ? "auto" : "none"}`} aria-hidden={!isOpen}>
      <div className={`fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed inset-y-0 left-0 w-1/3 bg-black/40 transition-opacity duration-300 hidden lg:block ${isOpen ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`fixed inset-y-0 left-1/3 right-2/3 bg-transparent hidden lg:block ${isOpen ? "block" : "hidden"}`} onClick={onClose} />

      <div className={`fixed right-0 top-0 h-full w-full sm:w-5/6 lg:w-2/3 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`} role="dialog" aria-modal="true">
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <button aria-label="Close" onClick={onClose} className="sm:hidden absolute top-3 right-3 z-30 p-2 rounded-full bg-white/90 border border-gray-200 shadow-md">
            <X className="w-5 h-5 text-gray-900" />
          </button>

          {/* Header (match service overlay) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start px-4 sm:px-6 pt-6 lg:pt-10 pb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {(item?.developer?.photoUrl || item?.developer?.user?.image) ? (
                  <img 
                    src={item?.developer?.photoUrl || item?.developer?.user?.image || '/images/avata/default.jpeg'} 
                    alt={item?.developer?.user?.name || ""} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] sm:text-base font-semibold text-gray-900 truncate max-w-[70vw] sm:max-w-none">{item?.title || "Portfolio"}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{item?.developer?.user?.name || ""}</div>
              </div>
            </div>
          </div>

          {/* Decorative separator with heart (copied from service overlay) */}
          <div className="relative mt-2 z-20 h-16">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#BEBEBE]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button 
                onClick={handleHeartClick}
                aria-label={isLiked ? "Unlike" : "Like"}
                className={`w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ${isLiked ? 'ring-red-300' : 'ring-black/10'} flex items-center justify-center transition ${pop ? 'like-bounce' : 'active:scale-95'} hover:shadow-[0_12px_32px_rgba(0,0,0,0.25)]`}
              >
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-black'}`} strokeWidth={1} />
              </button>
            </div>
          </div>
          <div className="h-8 sm:h-12" />

          {/* Content (banner + actions + overview) */}
          <div className="flex-1 overflow-y-auto pt-0 relative z-0">
            {/* Action pills: Details / Share */}
            <div className="px-4 sm:px-6 mb-6 flex items-center justify-center gap-4 relative z-20">
              <button onClick={() => setIsDetailsOpen(true)} className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm">
                <Info className="w-5 h-5" />
                <span className="font-medium">Details</span>
              </button>
              <div className="relative">
                <button onClick={handleShare} className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm">
                  <Share className="w-5 h-5" />
                  <span className="font-medium">Share</span>
                </button>
                {copied && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-md bg-black text-white text-xs shadow-md whitespace-nowrap pointer-events-none">link copied!</div>
                )}
              </div>
            </div>

            {/* Chips (fallback) */}
            {(() => {
              const fallback = [
                "Brand Designer",
                "UI/UX Designer",
                "Product Designer",
                "Figma",
                "Adobe Photoshop",
                "Designer"
              ];
              const chips = fallback.slice(0, 10);
              return (
                <div className="px-4 sm:px-6 mb-6 relative z-10">
                  <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-3">
                    {chips.map((chip) => (
                      <span key={chip} className="inline-flex items-center h-9 px-4 rounded-xl bg-[#F5F6F9] text-gray-700 text-sm font-medium">{chip}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Banner image */}
            <div className="z-0 mt-10 sm:mt-14 px-0.5 sm:px-1">
              <div className="relative mx-auto w-full max-w-[95%]" style={{ paddingTop: "56.25%" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {bestPortfolioImage ? (
                  <img
                    src={getOptimizedImageUrl(bestPortfolioImage, 1600, 900)}
                    alt={item.title || "Portfolio"}
                    className="absolute inset-0 w-full h-full object-cover rounded-md"
                    loading="lazy"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gray-100 rounded-md" />
                )}
              </div>
            </div>

            {/* Overview/Description section (match service spacing/typography) */}
            <div className="px-4 sm:px-6 mt-6 mb-10">
              <div className="mx-auto max-w-5xl">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Project Overview:</h3>
                <div className="space-y-5 text-gray-700 leading-7">
                  <p>
                    {item?.description || "This portfolio item highlights a recent project. The description and link (if available) provide additional context."}
                  </p>
                </div>
                {item?.url && (
                  <div className="mt-6">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm"
                    >
                      Visit Project
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Add-on metadata section (likes/views/timeline/tags) */}
            <div className="px-4 sm:px-6 mb-16">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4 text-sm text-gray-500">
                  <span className="font-semibold text-gray-900 mr-1">{today || ""}</span>
                  <span className="font-semibold text-gray-900">, Client</span>
                </div>
                <p className="text-gray-700 leading-7 mb-6">
                  This is a portfolio showcase. Some details are anonymized and timelines may be approximate. All images are for demonstration.
                </p>
                <div className="flex flex-wrap items-end gap-8 md:gap-12 mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Likes</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/></svg>
                    </div>
                    <div className="text-2xl text-gray-500 mt-2">{likeCount}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Views</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <div className="text-2xl text-gray-500 mt-2">85</div>
                  </div>
                  <div className="hidden md:block h-10 w-px bg-gray-300" />
                  <div className="min-w-[220px]">
                    <div className="text-sm text-gray-500 mb-1">Timeline</div>
                    <div className="text-2xl text-gray-500">{timelineStart}{timelineStart ? " – " : ""}{timelineEnd}</div>
                  </div>
                </div>
                <div>
                  <div className="mb-3 text-sm text-gray-500">Tags</div>
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const fallback = [
                        "Brand Designer",
                        "UI/UX Designer",
                        "Product Designer",
                        "Figma",
                        "Adobe Photoshop",
                        "Designer"
                      ];
                      const tags = fallback;
                      return tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center h-9 px-4  bg-[#F5F6F9] text-gray-700 text-sm font-medium">{tag}</span>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Final section: Freelancer card */}
            <div className="bg-[#F3F3F3] mt-4">
              <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {(item?.developer?.photoUrl || item?.developer?.user?.image) ? (
                        <img 
                          src={item?.developer?.photoUrl || item?.developer?.user?.image || '/images/avata/default.jpeg'} 
                          alt={item?.developer?.user?.name || "Freelancer"} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/avata/default.jpeg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-gray-900">
                      {item?.developer?.user?.name || "Freelancer"}
                    </div>
                    {item?.developer?.location && (
                      <div className="text-sm text-gray-500">{item.developer.location}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


