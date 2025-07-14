"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/ui/components/button";
import { Input } from "@/ui/components/input";

export function TodoAddForm() {
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const response = await fetch("/api/todos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: content.trim() }),
        });

        if (response.ok) {
          setContent("");
          router.refresh(); // Refresh server component
        } else {
          throw new Error("Failed to add todo");
        }
      } catch (error) {
        console.error("Failed to add todo:", error);
        // You can add toast notification here if needed
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a new todo..."
        disabled={isPending}
        className="flex-1"
      />
      <Button type="submit" disabled={isPending || !content.trim()}>
        {isPending ? "Adding..." : "Add Todo"}
      </Button>
    </form>
  );
}

export function TodoToggleButton({
  todoId,
  isDone,
}: {
  todoId: string;
  isDone: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/todos/${todoId}/toggle`, {
          method: "POST",
        });

        if (response.ok) {
          router.refresh(); // Refresh server component
        } else {
          throw new Error("Failed to toggle todo");
        }
      } catch (error) {
        console.error("Failed to toggle todo:", error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      disabled={isPending}
      className={isDone ? "line-through opacity-60" : ""}
    >
      {isPending ? "..." : isDone ? "✓" : "○"}
    </Button>
  );
}

export function TodoDeleteButton({ todoId }: { todoId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/todos/${todoId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          router.refresh(); // Refresh server component
        } else {
          throw new Error("Failed to delete todo");
        }
      } catch (error) {
        console.error("Failed to delete todo:", error);
      }
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="text-destructive hover:text-destructive"
    >
      {isPending ? "..." : "Delete"}
    </Button>
  );
}
