import { prisma } from "@/core/database/db";
import type {
  CreateTodoInput,
  UpdateTodoInput,
} from "@/features/todos/schemas/todo.schema";

export const getTodosByUserId = async (userId: string) => {
  return await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getTodoById = async (userId: string, id: string) => {
  return await prisma.todo.findFirst({
    where: {
      id,
      userId,
    },
  });
};

export const createTodo = async (userId: string, data: CreateTodoInput) => {
  return await prisma.todo.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const updateTodo = async (
  userId: string,
  id: string,
  data: UpdateTodoInput
) => {
  return await prisma.todo.updateMany({
    where: {
      id,
      userId,
    },
    data,
  });
};

export const deleteTodo = async (userId: string, id: string) => {
  return await prisma.todo.deleteMany({
    where: {
      id,
      userId,
    },
  });
};

export const toggleTodo = async (userId: string, id: string) => {
  const todo = await getTodoById(userId, id);
  if (!todo) {
    throw new Error("Todo not found");
  }

  return await prisma.todo.update({
    where: { id },
    data: { done: !todo.done },
  });
};
