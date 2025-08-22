import { Hono } from "hono";

import { requireAuth } from "@/features/auth/hono-auth";
import {
  getAllTodos,
  createTodoHandler,
  getTodoByIdHandler,
  updateTodoHandler,
  deleteTodoHandler,
  toggleTodoHandler,
} from "@/features/todos/controllers";

// Define context type for type safety
type Variables = {
  user: { id: string };
  userId: string;
};

const app = new Hono<{ Variables: Variables }>()
  // GET /api/todos - Get all todos for authenticated user
  .get("/", requireAuth(), getAllTodos as any)

  // POST /api/todos - Create new todo
  .post("/", requireAuth(), ...(createTodoHandler as any[]))

  // GET /api/todos/:id - Get specific todo
  .get("/:id", requireAuth(), getTodoByIdHandler as any)

  // PATCH /api/todos/:id - Update todo
  .patch("/:id", requireAuth(), ...(updateTodoHandler as any[]))

  // DELETE /api/todos/:id - Delete todo
  .delete("/:id", requireAuth(), deleteTodoHandler as any)

  // POST /api/todos/:id/toggle - Toggle todo completion
  .post("/:id/toggle", requireAuth(), toggleTodoHandler as any);

export default app;
