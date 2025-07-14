import { revalidatePath } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { path } = await request.json()

    // Revalidate the home page where todos are displayed
    revalidatePath(path || "/")

    return NextResponse.json({ revalidated: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to revalidate" }, { status: 500 })
  }
}
