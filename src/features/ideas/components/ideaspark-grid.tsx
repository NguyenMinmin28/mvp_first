"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/ui/components/button";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { optimisticLike, optimisticBookmark } from "@/core/utils/fireAndForget";
import { 
  FileText, 
  TrendingUp, 
  MousePointer, 
  Code, 
  Megaphone, 
  Video, 
  PenTool, 
  Music, 
  Briefcase,
  ThumbsUp,
  Heart,
  Send,
  Eye
} from "lucide-react";

interface Idea {
  id: string;
  title: string;
  summary: string;
  cover?: {
    id: string;
    storageKey: string;
  };
  coverUrl?: string;
  author: {
    id: string;
    name: string;
    image?: string;
  };
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  userInteraction?: {
    liked: boolean;
    bookmarked: boolean;
  };
  createdAt: string;
}

interface IdeaSparkGridProps {
  initialIdeas?: Idea[];
  initialCursor?: string;
}

const categories = [
  { id: "post-idea", label: "Post Idea", icon: FileText, color: "bg-blue-500" },
  { id: "trending", label: "Trending", icon: TrendingUp, color: "bg-orange-500" },
  { id: "graphics-design", label: "Graphics & Design", icon: MousePointer, color: "bg-purple-500" },
  { id: "programming-tech", label: "Programming & Tech", icon: Code, color: "bg-green-500" },
  { id: "digital-marketing", label: "Digital Marketing", icon: Megaphone, color: "bg-red-500" },
  { id: "video-animation", label: "Video & Animation", icon: Video, color: "bg-pink-500" },
  { id: "writing-translation", label: "Writing & Translation", icon: PenTool, color: "bg-indigo-500" },
  { id: "music-audio", label: "Music & Audio", icon: Music, color: "bg-yellow-500" },
  { id: "business", label: "Business", icon: Briefcase, color: "bg-gray-500" },
];

export function IdeaSparkGrid({ initialIdeas = [], initialCursor }: IdeaSparkGridProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("trending");
  const [userInteractions, setUserInteractions] = useState<Record<string, { liked: boolean; bookmarked: boolean }>>({});
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialCursor);

  useEffect(() => {
    if (initialIdeas.length === 0) {
      fetchIdeas();
    }
  }, [initialIdeas.length]);

  const fetchIdeas = async (opts?: { append?: boolean; cursor?: string; categoryId?: string }) => {
    setLoading(true);
    try {
      let skillIdsParam = "";
      // Map UI category id to Skill.category in DB
      const categoryMap: Record<string, string> = {
        "graphics-design": "Graphics & Design",
        "programming-tech": "Programming & Tech",
        "digital-marketing": "Digital Marketing",
        "video-animation": "Video & Animation",
        "writing-translation": "Writing & Translation",
        "music-audio": "Music & Audio",
        "business": "Business",
      };

      const catId = opts?.categoryId ?? selectedCategory;

      if (catId && catId !== "trending" && catId !== "post-idea") {
        const categoryName = categoryMap[catId];
        if (categoryName) {
          const skillsRes = await fetch(`/api/skills?category=${encodeURIComponent(categoryName)}`, { cache: "no-store" });
          if (skillsRes.ok) {
            const skillsData = await skillsRes.json();
            const skillIds: string[] = Array.isArray(skillsData.skills) ? skillsData.skills.map((s: any) => s.id) : [];
            if (skillIds.length > 0) {
              skillIdsParam = `&skillIds=${encodeURIComponent(skillIds.join(","))}`;
            }
          }
        }
      }

      const cursorParam = opts?.cursor ? `&cursor=${encodeURIComponent(opts.cursor)}` : "";
      const response = await fetch(`/api/ideas?status=APPROVED&limit=6${cursorParam}${skillIdsParam}`);
      if (response.ok) {
        const data = await response.json();
        setNextCursor(data.nextCursor);
        if (opts?.append) {
          setIdeas(prev => [...prev, ...(data.ideas || [])]);
        } else {
          setIdeas(data.ideas || []);
        }
      }
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === "post-idea") {
      if (!session?.user) {
        router.push('/auth/signin?callbackUrl=/ideas/submit');
        return;
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/ideas/submit';
      }
      return;
    }
    await fetchIdeas({ append: false, cursor: undefined, categoryId });
  };

  const handleViewMore = async () => {
    if (nextCursor) {
      await fetchIdeas({ append: true, cursor: nextCursor });
    }
  };

  const handleLike = (ideaId: string) => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/ideas');
      return;
    }
    
    // Find the current idea to get current state
    const currentIdea = ideas.find(idea => idea.id === ideaId);
    if (!currentIdea) return;
    
    const currentLiked = userInteractions[ideaId]?.liked || currentIdea.userInteraction?.liked || false;
    const currentLikeCount = currentIdea._count.likes;
    
    optimisticLike(
      ideaId,
      currentLiked,
      currentLikeCount,
      (newLiked, newCount) => {
        // Update UI immediately
        setUserInteractions(prev => ({
          ...prev,
          [ideaId]: { ...prev[ideaId], liked: newLiked }
        }));
        setIdeas(prev => prev.map(idea => 
          idea.id === ideaId 
            ? { ...idea, _count: { ...idea._count, likes: newCount } }
            : idea
        ));
      }
    );
  };

  const handleBookmark = (ideaId: string) => {
    if (!session?.user) {
      router.push('/auth/signin?callbackUrl=/ideas');
      return;
    }
    
    // Find the current idea to get current state
    const currentIdea = ideas.find(idea => idea.id === ideaId);
    if (!currentIdea) return;
    
    const currentBookmarked = userInteractions[ideaId]?.bookmarked || currentIdea.userInteraction?.bookmarked || false;
    const currentBookmarkCount = currentIdea._count.bookmarks;
    
    optimisticBookmark(
      ideaId,
      currentBookmarked,
      currentBookmarkCount,
      (newBookmarked, newCount) => {
        // Update UI immediately
        setUserInteractions(prev => ({
          ...prev,
          [ideaId]: { ...prev[ideaId], bookmarked: newBookmarked }
        }));
        setIdeas(prev => prev.map(idea => 
          idea.id === ideaId 
            ? { ...idea, _count: { ...idea._count, bookmarks: newCount } }
            : idea
        ));
      }
    );
  };

  const handleShare = (ideaId: string) => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Check out this idea!',
        url: `${window.location.origin}/ideas/${ideaId}`,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin}/ideas/${ideaId}`);
    }
  };

  const getDefaultCoverImage = (index: number) => {
    const defaultImages = [
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop", // Music/Ed Sheeran style
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop", // Colorful burst/abstract
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&h=300&fit=crop", // Autumn variations
      "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=500&h=300&fit=crop", // Space/astronaut
      "https://images.unsplash.com/photo-1558655146-d09347e92766?w=500&h=300&fit=crop", // Idea/brainstorming
      "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=500&h=300&fit=crop"  // Abstract art
    ];
    return defaultImages[index] || defaultImages[0];
  };

  return (
    <div className="bg-white">
      {/* Navigation Categories */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile: Horizontal scroll with padding for better UX */}
          <div className="relative">
            <div className="flex items-center py-2 sm:py-3 gap-2 sm:gap-3 overflow-x-auto scrollbar-hide">
              {/* Add left padding for mobile scroll */}
              <div className="flex-shrink-0 w-2 sm:hidden"></div>
              
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-md transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                    selectedCategory === category.id
                      ? `${category.color} text-white shadow-md`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <category.icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-xs font-medium leading-tight">{category.label}</span>
                </button>
              ))}
              
              {/* Add right padding for mobile scroll */}
              <div className="flex-shrink-0 w-2 sm:hidden"></div>
            </div>
            
            {/* Mobile scroll indicator */}
            <div className="hidden sm:hidden absolute right-0 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gradient-to-l from-white to-transparent pointer-events-none">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16 sm:py-20">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Ideas Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
              {ideas.map((idea, index) => (
                <div key={idea.id} className="bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                  {/* Cover Image */}
                  <div className="relative h-32 sm:h-40 lg:h-48 bg-gray-200 overflow-hidden">
                    {idea.coverUrl ? (
                      <Image
                        src={idea.coverUrl}
                        alt={idea.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getDefaultCoverImage(index);
                        }}
                      />
                    ) : (
                      <Image
                        src={getDefaultCoverImage(index)}
                        alt={idea.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3 line-clamp-2">
                      {idea.title}
                    </h3>
                    <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-3">
                      {idea.summary}
                    </p>

                    {/* Interaction Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4">
                        {session?.user ? (
                          <>
                            <button
                              onClick={() => handleLike(idea.id)}
                              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 ${
                                userInteractions[idea.id]?.liked || idea.userInteraction?.liked
                                  ? 'text-white bg-red-500 hover:bg-red-600'
                                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                              }`}
                            >
                              <ThumbsUp className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                userInteractions[idea.id]?.liked || idea.userInteraction?.liked ? 'fill-current' : ''
                              }`} />
                              <span className="text-xs sm:text-sm font-medium">{idea._count.likes}</span>
                            </button>

                            <button
                              onClick={() => handleBookmark(idea.id)}
                              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-200 ${
                                userInteractions[idea.id]?.bookmarked || idea.userInteraction?.bookmarked
                                  ? 'text-white bg-blue-500 hover:bg-blue-600'
                                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                              }`}
                            >
                              <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                userInteractions[idea.id]?.bookmarked || idea.userInteraction?.bookmarked ? 'fill-current' : ''
                              }`} />
                              <span className="text-sm font-medium">{idea._count.bookmarks}</span>
                            </button>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-400">
                              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-xs sm:text-sm font-medium">{idea._count.likes}</span>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-400">
                              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="text-sm font-medium">{idea._count.bookmarks}</span>
                            </div>
                          </>
                        )}

                        <button
                          onClick={() => handleShare(idea.id)}
                          className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200"
                        >
                          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="text-xs sm:text-sm font-medium">Share</span>
                        </button>
                      </div>

                      {/* View Details */}
                      <button 
                        onClick={() => {
                          if (session?.user) {
                            router.push(`/ideas/${idea.id}`);
                          } else {
                            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/ideas/${idea.id}`)}`);
                          }
                        }}
                        className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    </div>

                    {/* Author Info */}
                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-300 overflow-hidden">
                          <Image
                            src={`https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face`}
                            alt={idea.author.name}
                            width={32}
                            height={32}
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">{idea.author.name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(idea.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View More Stories */}
            <div className="text-center">
              <Button 
                size="lg"
                className="text-base sm:text-lg font-semibold px-6 sm:px-8 py-3 sm:py-4 bg-transparent text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-300"
                onClick={handleViewMore}
                disabled={!nextCursor}
              >
                VIEW MORE STORIES
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
