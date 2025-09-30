"use client";

import { Card, CardContent } from "@/ui/components/card";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Button } from "@/ui/components/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortfolioStep() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  // Cloudinary image uploads (up to 5)
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Load draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding.portfolio");
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Array.isArray(d.images)) setImages(d.images);
      if (typeof d.title === 'string') setTitle(d.title);
      if (typeof d.description === 'string') setDescription(d.description);
      if (typeof d.url === 'string') setUrl(d.url);
    } catch {}
  }, []);

  // Autosave
  useEffect(() => {
    const id = setTimeout(() => {
      try { localStorage.setItem("onboarding.portfolio", JSON.stringify({ images, title, description, url })); } catch {}
    }, 250);
    return () => clearTimeout(id);
  }, [images, title, description, url]);

  const handleUploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remainingSlots = Math.max(0, 5 - images.length);
    const toUpload = Array.from(files).slice(0, remainingSlots);
    if (toUpload.length === 0) return;

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of toUpload) {
        if (file.size > 10 * 1024 * 1024) continue;
        const basename = file.name.replace(/\.[^/.]+$/, "");
        const signRes = await fetch("/api/uploads/cloudinary-sign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "portfolio", resourceType: "image", useFilename: true, uniqueFilename: true, publicId: basename })
        });
        if (!signRes.ok) {
          const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME as string | undefined;
          const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET as string | undefined;
          if (!cloudName || !uploadPreset) continue;
          const fdUnsigned = new FormData();
          fdUnsigned.append("file", file);
          fdUnsigned.append("upload_preset", uploadPreset);
          const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fdUnsigned });
          const js = await up.json();
          if (up.ok && js?.secure_url) uploaded.push(js.secure_url as string);
          continue;
        }
        const { cloudName, apiKey, timestamp, folder, signature, publicId, useFilename, uniqueFilename } = await signRes.json();
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", apiKey);
        fd.append("timestamp", String(timestamp));
        fd.append("folder", folder || "portfolio");
        if (publicId) fd.append("public_id", publicId);
        if (useFilename !== undefined) fd.append("use_filename", String(useFilename));
        if (uniqueFilename !== undefined) fd.append("unique_filename", String(uniqueFilename));
        fd.append("signature", signature);
        const up = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
        const json = await up.json();
        if (up.ok && json?.secure_url) {
          uploaded.push(json.secure_url as string);
        }
      }
      if (uploaded.length) setImages((prev) => [...prev, ...uploaded].slice(0, 5));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl md:text-4xl font-extrabold">Portfolio</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-1">
            <Label>Upload up to 5 Work Samples</Label>
            <div className="space-y-2">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleUploadImages(e.target.files)}
                disabled={uploading || images.length >= 5}
              />
              <div className="text-xs text-gray-500">{uploading ? "Uploading..." : `${images.length}/5 uploaded`}</div>
              {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((src, idx) => (
                    <div key={src} className="relative group">
                      <img src={src} alt="portfolio" className="w-full h-28 object-cover rounded-md border" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 text-xs bg-black/60 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100"
                        onClick={() => removeImage(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label>Title/Project Name</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title/Project Name" />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" />
          </div>
          <div className="space-y-1">
            <Label>Enter URL</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Enter URL" />
          </div>

          <div className="pt-2 flex gap-3">
            <Button className="min-w-28" onClick={async () => {
              try { localStorage.setItem("onboarding.portfolio", JSON.stringify({ images, title, description, url })); } catch {}
              try {
                await fetch('/api/user/save-onboarding', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ portfolioLinks: images }),
                }).catch(() => {});
              } catch {}
              router.push("/onboarding/freelancer/verification");
            }}>Next</Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/onboarding/freelancer/verification")}
            >
              Skip
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


