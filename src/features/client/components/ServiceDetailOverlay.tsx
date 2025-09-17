"use client";

import { useEffect, useState } from "react";
import { Heart, Info, Share, X, Link as LinkIcon } from "lucide-react";

// Utilities: build responsive src/srcSet for Unsplash (reduces pixelation)
function appendParams(url: string, params: Record<string, string | number>) {
  const hasQuery = url.includes("?");
  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => query.append(k, String(v)));
  return url + (hasQuery ? "&" : "?") + query.toString();
}

function buildUnsplashSrcSet(url: string, targetSquare?: boolean) {
  if (!url.includes("images.unsplash.com")) {
    return { src: url, srcSet: undefined as string | undefined, sizes: undefined as string | undefined };
  }
  // Request higher quality, multiple widths. For squares, also request h to match.
  const widths = [600, 900, 1200, 1600];
  const srcSet = widths
    .map((w) => appendParams(url, { w, ...(targetSquare ? { h: w, fit: "crop" } : {}), q: 80, auto: "format" }) + ` ${w}w`)
    .join(", ");
  const src = appendParams(url, { w: 1200, ...(targetSquare ? { h: 1200, fit: "crop" } : {}), q: 80, auto: "format" });
  const sizes = targetSquare ? "(min-width: 1024px) 32vw, 33vw" : "(min-width: 1024px) 60vw, 100vw";
  return { src, srcSet, sizes };
}

type Developer = {
  id: string;
  name?: string | null;
  image?: string | null;
  location?: string | null;
};

export interface ServiceDetailData {
  id: string;
  slug?: string;
  title: string;
  shortDesc: string;
  coverUrl?: string | null;
  priceType: string;
  priceMin?: number | null;
  priceMax?: number | null;
  deliveryDays?: number | null;
  ratingAvg: number;
  ratingCount: number;
  views: number;
  likesCount?: number;
  userLiked?: boolean;
  developer: Developer;
  skills: string[];
  categories: string[];
  leadsCount: number;
}

interface ServiceDetailOverlayProps {
  isOpen: boolean;
  service: ServiceDetailData | null;
  onClose: () => void;
  onGetInTouch?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onFollow?: () => void;
}

export default function ServiceDetailOverlay({ isOpen, service, onClose, onGetInTouch, onPrev, onNext, onFollow }: ServiceDetailOverlayProps) {
  const [today, setToday] = useState("");
  const [likeCount, setLikeCount] = useState<number>(service?.likesCount ?? Math.max(1, Math.round((service?.views || 0) / 40)));
  const [isLiking, setIsLiking] = useState(false);
  const [isLiked, setIsLiked] = useState<boolean>((service as any)?.userLiked ?? false);
  const [pop, setPop] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timelineStart, setTimelineStart] = useState("");
  const [timelineEnd, setTimelineEnd] = useState("");

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  // Avoid SSR/CSR mismatch for time-dependent strings
  useEffect(() => {
    const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
    const now = new Date();
    setToday(now.toLocaleDateString(undefined, fmt));
    setTimelineStart(now.toLocaleDateString(undefined, fmt));
    const end = new Date(Date.now() + 20 * 24 * 3600 * 1000);
    setTimelineEnd(end.toLocaleDateString(undefined, fmt));
  }, []);

  // Sync heart state when service changes
  useEffect(() => {
    if (service) {
      setIsLiked((service as any).userLiked ?? false);
      setLikeCount(service.likesCount ?? Math.max(1, Math.round((service.views || 0) / 40)));
      setIsDetailsOpen(false);
    }
  }, [service?.id]);

  const handleHeartClick = async () => {
    if (!service?.id || isLiking) return;
    // Optimistic update
    const nextLiked = !isLiked;
    const prevLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(nextLiked);
    setLikeCount(Math.max(0, prevCount + (nextLiked ? 1 : -1)));
    if (nextLiked) {
      setPop(true);
      setTimeout(() => setPop(false), 500);
    }

    try {
      setIsLiking(true);
      const res = await fetch(`/api/services/${service.id}/like`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        if (typeof json.likeCount === "number") {
          setLikeCount(json.likeCount);
        }
        if (typeof json.liked === "boolean") {
          setIsLiked(json.liked);
        }
      } else {
        // Revert on failure
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch (e) {
      // Revert on error
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.origin + (service?.slug ? `/services/${service.slug}` : `/services`) : "";
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
    } catch (_) {
      // ignore
    } finally {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[60] pointer-events-${isOpen ? "auto" : "none"}`}
      aria-hidden={!isOpen}
    >
      {/* Mobile backdrop: darken entire screen */}
      <div
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Desktop backdrop: dim left 1/3, keep middle area clickable/transparent */}
      <div
        className={`fixed inset-y-0 left-0 w-1/3 bg-black/40 transition-opacity duration-300 hidden lg:block ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 left-1/3 right-2/3 bg-transparent hidden lg:block ${isOpen ? "block" : "hidden"}`}
        onClick={onClose}
      />

      {/* Sliding panel (responsive width) */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-5/6 lg:w-2/3 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="h-full flex flex-col">
          {/* Mobile Close Button */}
          <button
            aria-label="Close"
            onClick={onClose}
            className="sm:hidden absolute top-3 right-3 z-30 p-2 rounded-full bg-white/90 border border-gray-200 shadow-md"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between items-start px-4 sm:px-6 pt-6 lg:pt-10 pb-4 gap-3 sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {service?.developer?.image ? (
                  <img src={service.developer.image} alt={service.developer.name || ""} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-200" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[15px] sm:text-base font-semibold text-gray-900 truncate max-w-[70vw] sm:max-w-none">{service?.title ?? "Service"}</div>
                <div className="text-xs sm:text-sm text-gray-500 truncate">{service?.developer?.name ?? ""}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={onFollow}
                className="px-3 sm:px-4 h-9 sm:h-10 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 shadow-sm w-36 sm:w-40"
              >
                Follow
              </button>
              <button
                onClick={onGetInTouch}
                className="px-3 sm:px-4 h-9 sm:h-10 rounded-md bg-black text-white hover:bg-black/90 w-36 sm:w-40"
              >
                Get in Touch
              </button>
              <div className="hidden sm:block w-[2px] h-6 bg-gray-500" />
              <button
                onClick={onPrev}
                aria-label="Previous"
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-900 text-gray-900 bg-white hover:bg-gray-50"
              >
                {/* Left chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 mx-auto">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={onNext}
                aria-label="Next"
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-900 text-gray-900 bg-white hover:bg-gray-50"
              >
                {/* Right chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 mx-auto">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Decorative separator with heart */}
          <div className="relative mt-2 z-20 h-16">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-[#BEBEBE]" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <button onClick={handleHeartClick} aria-label="Like service" className={`w-16 h-16 rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] ring-1 ${isLiked ? 'ring-red-300' : 'ring-black/10'} flex items-center justify-center transition ${pop ? 'like-bounce' : 'active:scale-95'}`}>
                <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-black'}`} strokeWidth={1} />
              </button>
            </div>
          </div>
          {/* Spacer to keep future components area clear */}
          <div className="h-8 sm:h-12" />

          {/* Content */}
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
            {/* Skills chips */}
            {(() => {
              const fallback = [
                "Brand Designer",
                "UI/UX Designer",
                "Product Designer",
                "Figma",
                "Adobe Photoshop",
                "Designer"
              ];
              const chipsBase = (service?.skills && service.skills.length > 0)
                ? service.skills
                : (service?.categories && service.categories.length > 0
                    ? service.categories
                    : fallback);
              const chips = chipsBase.slice(0, 10);
              return (
                <div className="px-4 sm:px-6 mb-6 relative z-10">
                  <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-3">
                    {chips.map((chip) => (
                      <span
                        key={chip}
                        className="inline-flex items-center h-9 px-4 rounded-xl bg-[#F5F6F9] text-gray-700 text-sm font-medium"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {service?.coverUrl && (
              <div className="z-0 mt-10 sm:mt-14 px-0.5 sm:px-1">
                <div className="relative mx-auto w-full max-w-[95%]" style={{ paddingTop: "56.25%" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {(() => {
                    const u = buildUnsplashSrcSet(service.coverUrl || "", false);
                    return (
                      <img
                        src={u.src}
                        srcSet={u.srcSet}
                        sizes="(min-width: 1024px) 60vw, 100vw"
                        alt={service.title}
                        className="absolute inset-0 w-full h-full object-cover rounded-md"
                        loading="lazy"
                      />
                    );
                  })()}
                </div>
              </div>
            )}

            {/* <div className="px-4 sm:px-6 py-5 space-y-4">
              <p className="text-gray-700 leading-relaxed">{service?.shortDesc}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Rating</div>
                  <div className="font-medium">{service?.ratingAvg?.toFixed?.(1)} ({service?.ratingCount})</div>
                </div>
                <div>
                  <div className="text-gray-500">Leads</div>
                  <div className="font-medium">{service?.leadsCount}</div>
                </div>
                <div>
                  <div className="text-gray-500">Price</div>
                  <div className="font-medium">
                    {service?.priceType === "FIXED"
                      ? `$${service?.priceMin ?? 0}`
                      : `$${service?.priceMin ?? 0}/h`}
                  </div>
                </div>
                {service?.deliveryDays ? (
                  <div>
                    <div className="text-gray-500">Delivery</div>
                    <div className="font-medium">{service.deliveryDays} days</div>
                  </div>
                ) : null}
              </div>

              {!!service?.skills?.length && (
                <div>
                  <div className="text-sm text-gray-500 mb-2">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {service.skills.map((s) => (
                      <span key={s} className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div> */}

            {/* Service Overview */}
            <div className="px-4 sm:px-6 mt-6 mb-10">
              <div className="mx-auto max-w-5xl">
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Service Overview:</h3>
                <div className="space-y-5 text-gray-700 leading-7">
                  <p>
                    {service?.shortDesc ||
                      "This service helps you achieve your goals with a clear process and professional delivery. Below is an overview of what you can expect when working together."}
                  </p>
                  <p>
                    {"We focus on clarity, communication, and quality. Deliverables are tailored to your needs, with timelines and pricing agreed upfront. Revisions are included to ensure you are satisfied with the outcome."}
                  </p>
                </div>
              </div>
            </div>

            {/* Galleries (grid images) */}
            <div className="px-1 sm:px-2 mb-12">
              <div className="mx-auto w-full max-w-[96%]">
                <div className="grid grid-cols-3 grid-rows-3 gap-3 sm:gap-4">
                  {[
                    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop",
                    "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop"
                  ].map((src, idx) => (
                    <div key={idx} className="relative w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {(() => {
                        const u = buildUnsplashSrcSet(src, true);
                        return (
                          <img
                            src={u.src}
                            srcSet={u.srcSet}
                            sizes={u.sizes}
                            alt={`Gallery ${idx + 1}`}
                            className="absolute inset-0 w-full h-full object-cover rounded-md"
                            loading="lazy"
                          />
                        );
                      })()}
                      <div className="pt-[100%]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Two additional large showcase images */}
            <div className="space-y-8 mb-8">
              {[
                "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b",
                "https://images.unsplash.com/photo-1492724441997-5dc865305da7?q=80&w=800&auto=format&fit=crop"
              ].map((img, i) => (
                <div key={i} className="px-0.5 sm:px-1">
                  <div className="relative mx-auto w-full max-w-[95%]" style={{ paddingTop: "56.25%" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {(() => {
                      const u = buildUnsplashSrcSet(img, false);
                      return (
                        <img
                          src={u.src}
                          srcSet={u.srcSet}
                          sizes="(min-width: 1024px) 60vw, 100vw"
                          alt={`Showcase ${i + 1}`}
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                          loading="lazy"
                        />
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Description section */}
            <div className="px-4 sm:px-6 mb-16">
              <div className="mx-auto max-w-5xl text-gray-700">
                <div className="space-y-6 leading-7">
                  <p>
                    {service?.shortDesc ||
                      "Lorem Ipsum is simply dummy text of the printing and typesetting industry. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged."}
                  </p>
                  <p>
                    {"It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software."}
                  </p>
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button className="inline-flex items-center gap-2 px-5 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M10.59 13.41L9.17 12a4 4 0 0 1 0-5.66l2.12-2.12a4 4 0 0 1 5.66 5.66l-1.41 1.41"/><path d="M13.41 10.59L14.83 12a4 4 0 0 1 0 5.66l-2.12 2.12a4 4 0 0 1-5.66-5.66l1.41-1.41"/></svg>
                    <span className="font-medium">Completed work</span>
                  </button>
                  <div className="relative">
                    <button onClick={handleShare} className="inline-flex items-center gap-2 px-5 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><path d="M16 6l-4-4-4 4"/><path d="M12 2v14"/></svg>
                      <span className="font-medium">Share</span>
                    </button>
                    {copied && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-md bg-black text-white text-xs shadow-md whitespace-nowrap pointer-events-none">link copied!</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Add-on metadata section */}
            <div className="px-4 sm:px-6 mb-16">
              <div className="mx-auto max-w-5xl">
                <div className="mb-4 text-sm text-gray-500">
                  <span className="font-semibold text-gray-900 mr-1">{today || ""}</span>
                  <span className="font-semibold text-gray-900">, Client</span>
                </div>
                <p className="text-gray-700 leading-7 mb-6">
                  This is a portfolio showcase. Some details are anonymized and timelines may be approximate. All images are for demonstration.
                </p>
                {/* Likes / Views / Timeline */}
                <div className="flex flex-wrap items-end gap-8 md:gap-12 mb-8">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Likes</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                    </div>
                    <div className="text-2xl text-gray-500 mt-2">{likeCount}</div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Views</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div className="text-2xl text-gray-500 mt-2">{service?.views ?? 85}</div>
                  </div>

                  <div className="hidden md:block h-10 w-px bg-gray-300" />

                  <div className="min-w-[220px]">
                    <div className="text-sm text-gray-500 mb-1">Timeline</div>
                    <div className="text-2xl text-gray-500">
                      {(timelineStart || "")}
                      {timelineStart ? " – " : ""}
                      {(timelineEnd || "")}
                    </div>
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
                      const tags = (service?.skills && service.skills.length)
                        ? service.skills
                        : (service?.categories && service.categories.length ? service.categories : fallback);
                      return tags.map((tag) => (
                        <span key={tag} className="inline-flex items-center h-9 px-4  bg-[#F5F6F9] text-gray-700 text-sm font-medium">
                          {tag}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

              </div>
            </div>

            {/* Final section: Freelancer info on top, recent projects below */}
            <div className="bg-[#F3F3F3] mt-4">
              <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
                {/* Freelancer card */}
                <div className="p-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {service?.developer?.image ? (
                        <img src={service.developer.image} alt={service.developer.name || "Freelancer"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="mt-3 text-lg font-semibold text-gray-900">
                      {service?.developer?.name || "Freelancer"}
                    </div>
                    {service?.developer?.location && (
                      <div className="text-sm text-gray-500">{service.developer.location}</div>
                    )}

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={onFollow}
                        className="px-5 h-11 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 shadow-sm w-36 sm:w-40"
                      >
                        Follow
                      </button>
                      <button
                        onClick={onGetInTouch}
                        className="px-5 h-11 rounded-xl bg-black text-white hover:bg-black/90 w-36 sm:w-40"
                      >
                        Get in Touch
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent services gallery */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=600&auto=format&fit=crop",
                      "https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=600&auto=format&fit=crop"
                    ].map((img, i) => (
                      <div key={i}>
                        <div className="relative w-full overflow-hidden rounded-lg" style={{ paddingTop: "66.66%" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={`Recent ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-800">Project name</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Final composite section: freelancer + recent services (must be last) */}
           
          </div>
        </div>
      </div>

      {/* Centered Details Modal */}
      {isDetailsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsDetailsOpen(false)} />
          <div className="relative z-10 w-[92vw] max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Project Detail</h2>
              <button
                aria-label="Close details"
                onClick={() => setIsDetailsOpen(false)}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 sm:px-6 py-5">
              <div className="mb-4 relative">
                <button onClick={handleShare} className="inline-flex items-center gap-2 px-6 h-12 rounded-2xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 shadow-sm">
                  <Share className="w-5 h-5" />
                  <span className="font-semibold">Share</span>
                </button>
                {copied && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-black text-white text-xs shadow-md whitespace-nowrap">link copied!</div>
                )}
              </div>
              <div className="text-sm text-gray-500 mb-6">
                <span className="font-semibold text-gray-900 mr-1">{today || ""}</span>
                <span className="font-semibold text-gray-900">, Client</span>
              </div>

              <p className="text-gray-700 leading-7 mb-6">
                {service?.shortDesc || "Lorem Ipsum is simply dummy text of the printing and typesetting industry."}
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
                  <div className="text-2xl text-gray-500 mt-2">{service?.views ?? 0}</div>
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
                      "Designer",
                    ];
                    const tags = (service?.skills && service.skills.length)
                      ? service.skills
                      : (service?.categories && service.categories.length ? service.categories : fallback);
                    return tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center h-9 px-4 rounded-xl bg-[#F5F6F9] text-gray-700 text-sm font-medium">{tag}</span>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


