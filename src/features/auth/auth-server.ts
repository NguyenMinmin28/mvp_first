import { getServerSession } from "next-auth/next"

import { authOptions } from "./auth"

export async function getServerSessionUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return {
    id: (session.user as { id: string }).id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  }
}

export async function requireServerAuth() {
  const user = await getServerSessionUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  return user
}
