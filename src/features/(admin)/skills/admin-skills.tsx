"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { toast } from "sonner";

type Skill = {
  id: string;
  name: string;
  category: string | null;
  keywords: string[];
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  keywords: string;
};

export function AdminSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "General",
    keywords: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.category || "").toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [skills, search]);

  async function loadSkills() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/skills");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load skills");
      setSkills(data.skills || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load skills");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  const resetForm = () =>
    setForm({
      name: "",
      category: "General",
      keywords: "",
      id: undefined,
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        keywords: form.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      };
      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/admin/skills/${form.id}` : "/api/admin/skills";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save skill");
      toast.success(form.id ? "Skill updated" : "Skill created");
      resetForm();
      loadSkills();
    } catch (err: any) {
      toast.error(err.message || "Failed to save skill");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(skill: Skill) {
    setForm({
      id: skill.id,
      name: skill.name,
      category: skill.category || "General",
      keywords: (skill.keywords || []).join(", "),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill?")) return;
    try {
      const res = await fetch(`/api/admin/skills/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete skill");
      toast.success("Skill deleted");
      if (form.id === id) resetForm();
      loadSkills();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete skill");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Edit Skill" : "Add Skill"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. React"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="General"
              />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                placeholder="react, frontend"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : form.id ? "Update" : "Create"}
              </Button>
              {form.id && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel edit
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={loadSkills} disabled={loading}>
              {loading ? "Loading..." : "Reload"}
            </Button>
          </div>
          <div className="h-px w-full bg-muted" />
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No skills found.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {filtered.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {skill.category || "General"} • {(skill.keywords || []).join(", ")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(skill)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(skill.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

