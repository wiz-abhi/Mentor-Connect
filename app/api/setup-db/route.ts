import { NextResponse } from "next/server"
import { setupDatabase } from "@/lib/setup-db"

export async function GET() {
  try {
    const result = await setupDatabase()

    if (result.success) {
      return NextResponse.json({ message: "Database setup complete!" })
    } else {
      return NextResponse.json({ error: "Failed to set up database" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in setup-db route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

