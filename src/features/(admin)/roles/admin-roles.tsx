"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";
import { Label } from "@/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/components/card";
import { toast } from "sonner";

type Role = {
  id: string;
  name: string;
  category: string | null;
  isActive: boolean;
};

type FormState = {
  id?: string;
  name: string;
  category: string;
  isActive: boolean;
};

export function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return roles;
    const q = search.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q)
    );
  }, [roles, search]);

  async function loadRoles() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load roles");
      setRoles(data.roles || []);
    } catch (err: any) {
      toast.error(err.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRoles();
  }, []);

  const resetForm = () =>
    setForm({
      name: "",
      category: "",
      isActive: true,
      id: undefined,
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        category: form.category || null,
        isActive: form.isActive,
      };
      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/admin/roles/${form.id}` : "/api/admin/roles";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save role");
      toast.success(form.id ? "Role updated" : "Role created");
      resetForm();
      loadRoles();
    } catch (err: any) {
      toast.error(err.message || "Failed to save role");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(role: Role) {
    setForm({
      id: role.id,
      name: role.name,
      category: role.category || "",
      isActive: role.isActive,
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this role?")) return;
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to delete role");
      toast.success("Role deleted");
      if (form.id === id) resetForm();
      loadRoles();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{form.id ? "Edit Role" : "Add Role"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Frontend Developer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Development"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive" className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                Active
              </Label>
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
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button variant="outline" onClick={loadRoles} disabled={loading}>
              {loading ? "Loading..." : "Reload"}
            </Button>
          </div>
          <div className="h-px w-full bg-muted" />
          <div className="space-y-2">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground">No roles found.</p>
            ) : (
              <div className="divide-y rounded-md border">
                {filtered.map((role) => (
                  <div key={role.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                    <div className="flex-1">
                      <div className="font-medium">{role.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {role.category || "No category"} • {role.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(role)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(role.id)}
                      >
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

