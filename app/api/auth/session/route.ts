import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    // Get the session
    const { data, error } = await getSession()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      session: data.session
        ? {
            user: {
              id: data.session.user.id,
              email: data.session.user.email,
              user_metadata: data.session.user.user_metadata,
            },
            expires_at: data.session.expires_at,
          }
        : null,
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json({ error: "Failed to get session" }, { status: 500 })
  }
}

