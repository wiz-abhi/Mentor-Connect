import { type NextRequest, NextResponse } from "next/server"
import { createUserAccount } from "@/lib/auth"
import { sql } from "@vercel/postgres"

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, userType } = await req.json()

    if (!email || !password || !fullName || !userType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Creating user account...", { email, userType })
    const result = await createUserAccount(email, password, {
      full_name: fullName,
      user_type: userType as "mentor" | "mentee",
    })

    if (!result.success) {
      console.error("Failed to create user account:", result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    console.log("User created successfully, ID:", result.userId)

    // If user is a mentor, create a mentor profile
    if (userType === "mentor") {
      console.log("Creating mentor profile for user:", result.userId)
      try {
        const mentorProfile = await sql`
          INSERT INTO mentor_profiles (user_id, expertise, hourly_rate, is_available)
          VALUES (${result.userId}, ARRAY[]::text[], 0, true)
          RETURNING id
        `
        console.log("Mentor profile created successfully:", mentorProfile.rows[0])
      } catch (error) {
        console.error("Error creating mentor profile:", error)
        // Don't fail the registration if mentor profile creation fails
      }
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error) {
    console.error("Error in register route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

