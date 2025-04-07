import { type NextRequest, NextResponse } from "next/server"
import { transcribeAudio } from "@/lib/whisper-service"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    // Convert File to Blob
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type })

    // Transcribe audio
    const transcription = await transcribeAudio(audioBlob)

    return NextResponse.json({ transcription })
  } catch (error) {
    console.error("Error in transcription API:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}

