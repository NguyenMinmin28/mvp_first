"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Eye,
  Trash2,
  Calendar,
  User,
  Tag,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Card, CardContent } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";
import { DataTable, Column } from "@/ui/components/data-table";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  slug: string;
  category: string;
  categoryId: string | null;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  author: {
    id: string;
    name: string;
    avatar?: string;
    bio?: string;
  };
  _count: {
    views: number;
    clicks: number;
  };
  createdAt: string;
  updatedAt: string;
  isFeatured: boolean;
  views: number;
  clicks: number;
}

export function BlogManagementClient() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPosts(blogPosts);
    } else {
      const filtered = blogPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          post.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPosts(filtered);
    }
  }, [searchTerm, blogPosts]);

  // Reset to first page whenever the filtered list changes
  useEffect(() => {
    setPage(1);
  }, [filteredPosts.length]);

  const fetchBlogPosts = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching blog posts...");
      const response = await fetch("/api/admin/blog/posts");
      console.log("🔍 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Response data:", data);
        setBlogPosts(data.posts || []);
        console.log("🔍 Set blog posts:", data.posts?.length || 0);
      } else {
        const errorText = await response.text();
        console.error(
          "❌ Failed to fetch blog posts:",
          response.status,
          errorText
        );
      }
    } catch (error) {
      console.error("❌ Error fetching blog posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setBlogPosts(blogPosts.filter((post) => post.id !== postId));
      } else {
        alert("Failed to delete blog post");
      }
    } catch (error) {
      console.error("Error deleting blog post:", error);
      alert("Error deleting blog post");
    }
  };

  const handleToggleFeatured = async (
    postId: string,
    currentFeatured: boolean
  ) => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${postId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isFeatured: !currentFeatured,
        }),
      });

      if (response.ok) {
        setBlogPosts(
          blogPosts.map((post) =>
            post.id === postId
              ? { ...post, isFeatured: !currentFeatured }
              : post
          )
        );
      } else {
        alert("Failed to update featured status");
      }
    } catch (error) {
      console.error("Error updating featured status:", error);
      alert("Error updating featured status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-green-100 text-green-800">Published</Badge>;
      case "DRAFT":
        return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not published";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stats computed from the current filtered list for relevance
  const stats = {
    total: filteredPosts.length,
    published: filteredPosts.filter((p) => p.status === "PUBLISHED").length,
    drafts: filteredPosts.filter((p) => p.status === "DRAFT").length,
    featured: filteredPosts.filter((p) => p.isFeatured).length,
    views: filteredPosts.reduce((sum, p) => sum + (p.views || 0), 0),
    clicks: filteredPosts.reduce((sum, p) => sum + (p.clicks || 0), 0),
  };

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(stats.total / ITEMS_PER_PAGE));
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = filteredPosts.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-40 animate-pulse" />
          <div className="h-9 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
        <div className="grid gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar - larger colorful cards */}
      <div className="grid grid-rows-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-blue-700/90">
                  Total
                </p>
                <p className="text-xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <User className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-emerald-700/90">
                  Published
                </p>
                <p className="text-xl font-bold text-emerald-900">
                  {stats.published}
                </p>
              </div>
              <CheckIcon />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-amber-700/90">
                  Drafts
                </p>
                <p className="text-xl font-bold text-amber-900">
                  {stats.drafts}
                </p>
              </div>
              <FileIcon />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-purple-700/90">
                  Featured
                </p>
                <p className="text-xl font-bold text-purple-900">
                  {stats.featured}
                </p>
              </div>
              <StarIcon />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-indigo-50 border-indigo-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-indigo-700/90">
                  Views
                </p>
                <p className="text-xl font-bold text-indigo-900">
                  {stats.views}
                </p>
              </div>
              <Eye className="h-5 w-5 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-rose-50 border-rose-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-rose-700/90">
                  Clicks
                </p>
                <p className="text-xl font-bold text-rose-900">
                  {stats.clicks}
                </p>
              </div>
              <MessageSquare className="h-5 w-5 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Controls row - no wrapper */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search posts by title, excerpt, author, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/blog/new">
            <Button className="h-11 px-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Post
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={fetchBlogPosts}
            className="h-11 px-3 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Blog Posts Table using shared DataTable */}
      {(() => {
        type Row = {
          id: string;
          title: string;
          excerpt: string;
          authorName: string;
          category: string;
          status: "DRAFT" | "PUBLISHED" | string;
          views: number;
          clicks: number;
          isFeatured: boolean;
          createdAt: string;
          publishedAt: string | null;
          slug: string;
        };

        const rows: Row[] = pageItems.map((post) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          authorName: post.author.name,
          category: post.category,
          status: post.status,
          views: post.views,
          clicks: post.clicks,
          isFeatured: post.isFeatured,
          createdAt: post.createdAt,
          publishedAt: post.publishedAt,
          slug: post.slug,
        }));

        const columns: Column<Row>[] = [
          {
            key: "title",
            label: "Post",
            sortable: true,
            render: (_, item) => (
              <div className="max-w-xs">
                <h3 className="font-medium text-gray-900 truncate">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 truncate mt-0.5">
                  {item.excerpt}
                </p>
              </div>
            ),
          },
          {
            key: "authorName",
            label: "Author",
            sortable: true,
            render: (value) => (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{value}</span>
              </div>
            ),
          },
          {
            key: "category",
            label: "Category",
            sortable: true,
            render: (value) => (
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">{value}</span>
              </div>
            ),
          },
          {
            key: "status",
            label: "Status",
            sortable: true,
            render: (value: Row["status"]) => getStatusBadge(value),
          },
          {
            key: "views",
            label: "Stats",
            render: (_, item) => (
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>Views: {item.views}</span>
                  {item.isFeatured && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                      Featured
                    </Badge>
                  )}
                </div>
                <div>Clicks: {item.clicks}</div>
              </div>
            ),
          },
          {
            key: "createdAt",
            label: "Created",
            sortable: true,
            render: (value) => (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {formatDate(value)}
                </span>
              </div>
            ),
          },
          {
            key: "publishedAt",
            label: "Published",
            sortable: true,
            render: (value) => (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {formatDate(value)}
                </span>
              </div>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            render: (_, item) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFeatured(item.id, item.isFeatured);
                  }}
                  className={`h-8 px-2 flex items-center gap-1 ${
                    item.isFeatured
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  {item.isFeatured ? "★" : "☆"}
                  {item.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Link href={`/admin/blog/edit/${item.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                </Link>
                <Link href={`/blog/${item.slug}`} target="_blank">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="h-8 px-2 flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </Button>
              </div>
            ),
          },
        ];

        return (
          <>
            <DataTable<Row>
              data={rows}
              columns={columns}
              title="Blog Posts"
              hideSearch
              unstyled
              className=""
            />

            {/* Pagination - compact */}
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <div>
                Showing {startIndex + 1} to {Math.min(endIndex, stats.total)} of{" "}
                {stats.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  Prev
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="h-8 px-2"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2"
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

// Local simple icons (to avoid new imports)
function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-emerald-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
function FileIcon() {
  return (
    <svg
      className="h-5 w-5 text-amber-600"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function StarIcon() {
  return (
    <svg
      className="h-5 w-5 text-purple-600"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 .587l3.668 7.431L24 9.748l-6 5.847 1.416 8.263L12 19.771l-7.416 4.087L6 15.595 0 9.748l8.332-1.73z" />
    </svg>
  );
}
