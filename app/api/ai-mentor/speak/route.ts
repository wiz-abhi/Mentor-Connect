import { NextResponse } from 'next/server';
import { HumeClient } from 'hume';
import path from 'path';
import fs from 'fs';

// Initialize the Hume client
const hume = new HumeClient({
  apiKey: process.env.HUME_API_KEY!
});

export async function POST(request: Request) {
  let speechFile: string | null = null;
  
  try {
    if (!process.env.HUME_API_KEY) {
      throw new Error('HUME_API_KEY is not configured');
    }
    
    const { text, description } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    console.log(`Using description: "${description || 'A friendly, supportive mentor'}"`);
    
    // Create speech from text using Hume AI
    const speechResponse = await hume.tts.synthesizeJson({
   utterances: [{
      voice: { name: "Ava Song", provider: "HUME_AI" },
      description: "The voice must be soothing, joyous and humble like that of a friend.",
      text: text,
    }],
    });
    
    // Get the audio buffer from the response
    const audioData = speechResponse.generations[0].audio;
    
    // Create a temporary file path with a unique name
    const tempFileName = `speech-${Date.now()}.wav`;
    speechFile = path.join(process.cwd(), 'public', 'temp', tempFileName);
    
    // Ensure the temp directory exists
    const tempDir = path.dirname(speechFile);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Handle the audio data based on its format
    let buffer;
    if (typeof audioData === 'string') {
      // If it's a base64 string
      buffer = Buffer.from(audioData, 'base64');
    } else if (audioData instanceof Uint8Array) {
      // If it's a Uint8Array
      buffer = Buffer.from(audioData);
    } else {
      // If it's something else (likely a Buffer already)
      buffer = Buffer.from(audioData);
    }
    
    await fs.promises.writeFile(speechFile, buffer);
    
    console.log(`Speech file created at: ${tempFileName}`);
    
    // Return the URL to the audio file exactly as expected by speakResponse
    return NextResponse.json({
      audioUrl: `/temp/${tempFileName}`
    });
    
  } catch (error) {
    console.error('Error in speak route:', error);
    
    // Clean up the speech file if it exists and there was an error
    if (speechFile && fs.existsSync(speechFile)) {
      try {
        await fs.promises.unlink(speechFile);
      } catch (cleanupError) {
        console.error('Error cleaning up speech file:', cleanupError);
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}