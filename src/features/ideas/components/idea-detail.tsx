"use client";

import { useState } from "react";
import { ImageWithShimmer } from "@/ui/components/image-with-shimmer";
import { Button } from "@/ui/components/button";
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  Send, 
  ArrowLeft,
  ThumbsUp,
  User,
  Calendar,
  Tag,
  Edit
} from "lucide-react";
import { useRouter } from "next/navigation";
import { optimisticLike, optimisticBookmark } from "@/core/utils/fireAndForget";

interface Idea {
  id: string;
  title: string;
  summary: string;
  body: string | null;
  cover: {
    id: string;
    storageKey: string;
  } | null;
  coverUrl: string | null;
  author: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  skills: { 
    Skill: { 
      id: string; 
      name: string; 
      category: string; 
    } 
  }[];
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
    connects: number;
  };
  userInteraction?: {
    liked: boolean;
    bookmarked: boolean;
  };
  createdAt: Date;
  status: string;
}

interface IdeaDetailProps {
  idea: Idea;
  currentUserId: string;
}

export function IdeaDetail({ idea, currentUserId }: IdeaDetailProps) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(idea.userInteraction?.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(idea.userInteraction?.bookmarked || false);
  const [likeCount, setLikeCount] = useState(idea._count.likes);
  const [bookmarkCount, setBookmarkCount] = useState(idea._count.bookmarks);

  const handleLike = () => {
    optimisticLike(
      idea.id,
      isLiked,
      likeCount,
      (newLiked, newCount) => {
        setIsLiked(newLiked);
        setLikeCount(newCount);
      }
    );
  };

  const handleBookmark = () => {
    optimisticBookmark(
      idea.id,
      isBookmarked,
      bookmarkCount,
      (newBookmarked, newCount) => {
        setIsBookmarked(newBookmarked);
        setBookmarkCount(newCount);
      }
    );
  };

  const handleConnect = async () => {
    try {
      const response = await fetch(`/api/ideas/${idea.id}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "I'm interested in collaborating on this idea!"
        }),
      });

      if (response.ok) {
        alert('Connection request sent successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection:', error);
      alert('Failed to send connection request');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: idea.title,
        text: idea.summary,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/ideas')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Ideas
        </Button>

        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Cover Image */}
          {(idea.coverUrl || idea.cover) && (
            <div className="relative h-64 md:h-80 bg-gray-200">
              <ImageWithShimmer
                src={idea.coverUrl || `/api/files/${idea.cover?.storageKey}`}
                alt={idea.title}
                fill
                aspectRatio="16/9"
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                shimmerSize="card"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              {idea.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                {idea.author?.image ? (
                  <ImageWithShimmer
                    src={idea.author.image}
                    alt={idea.author.name || 'Author'}
                    width={32}
                    height={32}
                    className="rounded-full"
                    shimmerSize="thumbnail"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
                <span className="text-sm font-medium text-gray-700">
                  {idea.author?.name || 'Anonymous'}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date(idea.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Skills */}
            {idea.skills.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {idea.skills.map((skill) => (
                    <span
                      key={skill.Skill.id}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                    >
                      {skill.Skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                {idea.summary}
              </p>
            </div>

            {/* Body Content */}
            {idea.body && (
              <div className="mb-8">
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {idea.body}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Button
                variant={isLiked ? "default" : "outline"}
                onClick={handleLike}
                className={`flex items-center gap-2 ${
                  isLiked 
                    ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                    : 'hover:border-red-500 hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? 'fill-current text-white' : 'text-gray-500'}`} />
                <span>{likeCount}</span>
              </Button>

              <Button
                variant={isBookmarked ? "default" : "outline"}
                onClick={handleBookmark}
                className={`flex items-center gap-2 ${
                  isBookmarked 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
                    : 'hover:border-blue-500 hover:text-blue-500'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-white' : 'text-gray-500'}`} />
                <span>{bookmarkCount}</span>
              </Button>

              <Button
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>{idea._count.comments}</span>
              </Button>

              {idea.author?.id !== currentUserId && (
                <Button
                  onClick={handleConnect}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Connect
                </Button>
              )}

              {idea.author?.id === currentUserId && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/user/ideas/${idea.id}/edit`)}
                  className="flex items-center gap-2 hover:bg-gray-100"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Share
              </Button>
            </div>

            {/* Stats */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{likeCount}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{idea._count.comments}</div>
                  <div className="text-sm text-gray-500">Comments</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{bookmarkCount}</div>
                  <div className="text-sm text-gray-500">Bookmarks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{idea._count.connects}</div>
                  <div className="text-sm text-gray-500">Connections</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
