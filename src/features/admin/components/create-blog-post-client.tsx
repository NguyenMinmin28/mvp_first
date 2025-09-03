"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Textarea } from "@/ui/components/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { Badge } from "@/ui/components/badge";

export function CreateBlogPostClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [categories, setCategories] = useState<Array<{id: string, name: string, slug: string, color?: string}>>([]);
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    status: "DRAFT" as "DRAFT" | "PUBLISHED",
    coverUrl: "",
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/blog/categories');
        const data = await response.json();
        if (data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Handle image URL change
    if (name === 'coverUrl') {
      setImageError(false);
      if (value) {
        setImageLoading(true);
        // Test if image loads successfully
        const img = new Image();
        img.onload = () => {
          setImageLoading(false);
          setImageError(false);
        };
        img.onerror = () => {
          setImageLoading(false);
          setImageError(true);
        };
        img.src = value;
      } else {
        setImageLoading(false);
        setImageError(false);
      }
    }
  };

  const handleStatusChange = (status: "DRAFT" | "PUBLISHED") => {
    setFormData((prev) => ({
      ...prev,
      status,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/blog/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/admin/blog/edit/${data.post.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create blog post");
      }
    } catch (error) {
      console.error("Error creating blog post:", error);
      alert("Error creating blog post");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Blog
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Blog Post</h1>
            <p className="text-gray-600 mt-1">
              Write and publish your next blog post
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2"
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? "Hide Preview" : "Show Preview"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter your blog post title..."
                    required
                    className="text-lg"
                  />
                  {formData.title && (
                    <p className="text-sm text-gray-500 mt-1">
                      Slug: {generateSlug(formData.title)}
                    </p>
                  )}
                </div>

                {/* Excerpt */}
                <div>
                  <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
                    Excerpt *
                  </label>
                  <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    placeholder="Write a brief summary of your post..."
                    required
                    rows={3}
                  />
                </div>

                {/* Cover Image URL */}
                <div>
                  <label htmlFor="coverUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Cover Image URL
                  </label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        id="coverUrl"
                        name="coverUrl"
                        type="url"
                        value={formData.coverUrl}
                        onChange={handleInputChange}
                        placeholder="https://example.com/image.jpg"
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a direct link to an image on the internet
                      </p>
                      {imageError && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ Invalid image URL. Please check the link and try again.
                        </p>
                      )}
                    </div>
                    {/* Image Preview */}
                    {formData.coverUrl && (
                      <div className="w-24 h-24 flex-shrink-0">
                        <div className="relative w-full h-full">
                          {imageLoading ? (
                            <div className="w-full h-full bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                            </div>
                          ) : imageError ? (
                            <div className="w-full h-full bg-red-50 rounded-lg border-2 border-red-200 flex items-center justify-center">
                              <span className="text-red-500 text-xs text-center">Invalid Image</span>
                            </div>
                          ) : (
                            <img
                              src={formData.coverUrl}
                              alt="Cover preview"
                              className="w-full h-full object-cover rounded-lg border-2 border-gray-200"
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
                            <span className="text-white text-xs font-medium opacity-0 hover:opacity-100 transition-opacity">
                              Preview
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Full Size Preview */}
                  {formData.coverUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-2">Full size preview:</p>
                      <div className="w-full max-w-md h-32 rounded-lg overflow-hidden border border-gray-200">
                        <img
                          src={formData.coverUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content */}
                <div>
                  <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                    Content *
                  </label>
                  <Textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Write your blog post content here..."
                    required
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.status === "DRAFT" ? "default" : "outline"}
                      onClick={() => handleStatusChange("DRAFT")}
                      className="flex items-center gap-2"
                    >
                      <Badge variant="secondary">Draft</Badge>
                      Save as draft
                    </Button>
                    <Button
                      type="button"
                      variant={formData.status === "PUBLISHED" ? "default" : "outline"}
                      onClick={() => handleStatusChange("PUBLISHED")}
                      className="flex items-center gap-2"
                    >
                      <Badge variant="default">Published</Badge>
                      Publish now
                    </Button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {loading ? "Creating..." : "Create Post"}
                  </Button>
                  <Link href="/admin/blog">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Cover Image Preview */}
                  {formData.coverUrl && (
                    <div className="w-full h-32 rounded-lg overflow-hidden">
                      <img
                        src={formData.coverUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {formData.title || "Your Title Here"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.category || "Category"}
                    </p>
                  </div>
                  <p className="text-gray-600">
                    {formData.excerpt || "Your excerpt will appear here..."}
                  </p>
                  <div className="prose prose-sm max-w-none">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: formData.content
                          ? formData.content.replace(/\n/g, "<br>")
                          : "Your content will appear here...",
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
