import { Context } from "hono";
import { zValidator } from "@hono/zod-validator";

import { requireAuth } from "@/features/auth/hono-auth";
import {
  createTodoSchema,
  updateTodoSchema,
} from "@/features/todos/schemas/todo.schema";
import {
  createTodo,
  deleteTodo,
  getTodoById,
  getTodosByUserId,
  toggleTodo,
  updateTodo,
} from "@/features/todos/services/todos.service";

// Define context type for type safety
type Variables = {
  user: { id: string };
  userId: string;
};

type TodoContext = Context<{ Variables: Variables }>;

// GET /api/todos - Get all todos for authenticated user
export const getAllTodos = async (c: TodoContext) => {
  try {
    const userId = c.get("userId");
    console.log("Getting todos for user:", userId);

    const todos = await getTodosByUserId(userId);
    return c.json({ success: true, data: todos });
  } catch (error) {
    console.error("Error fetching todos:", error);
    return c.json({ error: "Failed to fetch todos" }, 500);
  }
};

// POST /api/todos - Create new todo
export const createTodoHandler = [
  zValidator("json", createTodoSchema),
  async (c: any) => {
    try {
      const userId = c.get("userId");
      const data = c.req.valid("json");

      console.log("Creating todo for user:", userId, "data:", data);
      const todo = await createTodo(userId, data);

      return c.json({ success: true, data: todo });
    } catch (error) {
      console.error("Error creating todo:", error);
      return c.json({ error: "Failed to create todo" }, 500);
    }
  },
];

// GET /api/todos/:id - Get specific todo
export const getTodoByIdHandler = async (c: TodoContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const todo = await getTodoById(userId, id);

    if (!todo) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ success: true, data: todo });
  } catch (error) {
    console.error("Error fetching todo:", error);
    return c.json({ error: "Failed to fetch todo" }, 500);
  }
};

// PATCH /api/todos/:id - Update todo
export const updateTodoHandler = [
  zValidator("json", updateTodoSchema),
  async (c: any) => {
    try {
      const userId = c.get("userId");
      const id = c.req.param("id");
      const data = c.req.valid("json");

      const result = await updateTodo(userId, id, data);

      if (result.count === 0) {
        return c.json({ error: "Todo not found" }, 404);
      }

      const updatedTodo = await getTodoById(userId, id);
      return c.json({ success: true, data: updatedTodo });
    } catch (error) {
      console.error("Error updating todo:", error);
      return c.json({ error: "Failed to update todo" }, 500);
    }
  },
];

// DELETE /api/todos/:id - Delete todo
export const deleteTodoHandler = async (c: TodoContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const result = await deleteTodo(userId, id);

    if (result.count === 0) {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ success: true, message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return c.json({ error: "Failed to delete todo" }, 500);
  }
};

// POST /api/todos/:id/toggle - Toggle todo completion
export const toggleTodoHandler = async (c: TodoContext) => {
  try {
    const userId = c.get("userId");
    const id = c.req.param("id");

    const todo = await toggleTodo(userId, id);

    return c.json({ success: true, data: todo });
  } catch (error) {
    console.error("Error toggling todo:", error);

    if (error instanceof Error && error.message === "Todo not found") {
      return c.json({ error: "Todo not found" }, 404);
    }

    return c.json({ error: "Failed to toggle todo" }, 500);
  }
};
