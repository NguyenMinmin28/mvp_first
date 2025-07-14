import { z } from "zod"

export const createTodoSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(500, "Content too long"),
})

export const updateTodoSchema = z.object({
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(500, "Content too long")
    .optional(),
  done: z.boolean().optional(),
})

export const todoIdParamSchema = z.object({
  id: z.string().length(24, "Invalid todo ID"), // MongoDB ObjectId
})

export type CreateTodoInput = z.infer<typeof createTodoSchema>
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>
export type TodoIdParam = z.infer<typeof todoIdParamSchema>
