import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function POST(request: Request) {
  let audioFile: string | null = null;
  
  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;

    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await audioBlob.arrayBuffer());

    // Create a temporary file path with a unique name
    const tempFileName = `audio-${Date.now()}.webm`;
    audioFile = path.join(process.cwd(), 'public', 'temp', tempFileName);
    
    // Ensure the temp directory exists
    const tempDir = path.dirname(audioFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write the audio file
    await fs.promises.writeFile(audioFile, buffer);

    // Transcribe the audio
    const transcription = await groq.audio.transcriptions.create({
      file: fs.createReadStream(audioFile),
      model: "whisper-large-v3",
      response_format: "verbose_json",
    });

    // Clean up: Delete the temporary file
    try {
      await fs.promises.unlink(audioFile);
    } catch (cleanupError) {
      console.error('Error cleaning up audio file:', cleanupError);
    }

    if (!transcription.text) {
      throw new Error('No transcription received');
    }

    return NextResponse.json({ text: transcription.text });

  } catch (error) {
    console.error('Error in transcribe route:', error);
    
    // Clean up the audio file if it exists
    if (audioFile && fs.existsSync(audioFile)) {
      try {
        await fs.promises.unlink(audioFile);
      } catch (cleanupError) {
        console.error('Error cleaning up audio file:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    );
  }
} 