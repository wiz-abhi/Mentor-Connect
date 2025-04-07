import { type NextRequest, NextResponse } from "next/server"

// In a real application, you would use a proper signaling server with WebSockets
// This is a simplified implementation using polling

// Store for signaling messages
const signalingStore: Record<string, any[]> = {}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message, type } = await req.json()

    if (!sessionId || !message || !type) {
      return NextResponse.json({ error: "sessionId, message, and type are required" }, { status: 400 })
    }

    // Initialize session if it doesn't exist
    if (!signalingStore[sessionId]) {
      signalingStore[sessionId] = []
    }

    // Add message to store
    signalingStore[sessionId].push({
      type,
      message,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in signaling API:", error)
    return NextResponse.json({ error: "Failed to process signaling message" }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get("sessionId")
    const lastTimestamp = url.searchParams.get("lastTimestamp") || "0"

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 })
    }

    // Initialize session if it doesn't exist
    if (!signalingStore[sessionId]) {
      signalingStore[sessionId] = []
    }

    // Get messages newer than lastTimestamp
    const messages = signalingStore[sessionId].filter((msg) => msg.timestamp > Number.parseInt(lastTimestamp))

    return NextResponse.json({
      messages,
      timestamp: Date.now(),
    })
  } catch (error) {
    console.error("Error in signaling API:", error)
    return NextResponse.json({ error: "Failed to get signaling messages" }, { status: 500 })
  }
}

