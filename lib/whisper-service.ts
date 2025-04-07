// Transcribe audio using Whisper API
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    // Convert Blob to File
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" })

    // Create form data
    const formData = new FormData()
    formData.append("file", file)
    formData.append("model", "whisper-1")

    // Call Whisper API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Whisper API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.text
  } catch (error) {
    console.error("Error transcribing audio:", error)
    throw error
  }
}

// Process and store session transcript
export async function processSessionTranscript(
  sessionId: string,
  audioBlob: Blob,
  speakerLabels: Record<string, string>,
): Promise<string> {
  try {
    // Transcribe audio
    const transcription = await transcribeAudio(audioBlob)

    // In a real application, you would process the transcription to add speaker labels
    // This is a simplified implementation

    // Format transcript with speaker labels
    const formattedTranscript = `
Session Transcript (ID: ${sessionId})
-----------------

${transcription}
`

    // Store transcript in database (simplified)
    // In a real application, you would store this in your database
    console.log("Storing transcript for session:", sessionId)

    return formattedTranscript
  } catch (error) {
    console.error("Error processing session transcript:", error)
    throw error
  }
}

