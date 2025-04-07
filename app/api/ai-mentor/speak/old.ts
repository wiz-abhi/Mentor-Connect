import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import path from 'path';
import fs from 'fs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

export async function POST(request: Request) {
  let speechFile: string | null = null;

  try {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Create speech from text
    const wav = await groq.audio.speech.create({
      model: "playai-tts",
      voice: "Aaliyah-PlayAI",
      response_format: "wav",
      input: text,
    });

    // Convert to buffer
    const buffer = Buffer.from(await wav.arrayBuffer());

    // Create a temporary file path with a unique name
    const tempFileName = `speech-${Date.now()}.wav`;
    speechFile = path.join(process.cwd(), 'public', 'temp', tempFileName);
    
    // Ensure the temp directory exists
    const tempDir = path.dirname(speechFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write the file
    await fs.promises.writeFile(speechFile, buffer);

    // Return the URL to the audio file
    return NextResponse.json({
      audioUrl: `/temp/${tempFileName}`
    });

  } catch (error) {
    console.error('Error in speak route:', error);
    
    // Clean up the speech file if it exists
    if (speechFile && fs.existsSync(speechFile)) {
      try {
        await fs.promises.unlink(speechFile);
      } catch (cleanupError) {
        console.error('Error cleaning up speech file:', cleanupError);
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
} 