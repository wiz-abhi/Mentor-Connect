import { NextResponse } from "next/server"
import { getUserFromCookie } from "@/lib/auth"

export async function GET() {
  try {
    const { user } = await getUserFromCookie()

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in user route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

