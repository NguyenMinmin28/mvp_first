export type Todo = {
  id: string
  content: string
  done: boolean
  userId: string
  createdAt: Date
  updatedAt: Date
}

export type TodoResponse = {
  data: Todo[]
}

export type SingleTodoResponse = {
  data: Todo
}

export type TodoCreateResponse = {
  data: Todo
}

export type TodoDeleteResponse = {
  success: boolean
}
