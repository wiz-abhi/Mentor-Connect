import { NextResponse } from 'next/server';
import { ElevenLabsClient } from 'elevenlabs';
import { Readable } from 'stream';

// Initialize the ElevenLabs client
const elevenLabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_LABS_API_KEY!
});

// Default voice ID - you can change this to your preferred voice
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // Example voice ID

export async function POST(request: Request) {
  try {
    if (!process.env.ELEVEN_LABS_API_KEY) {
      throw new Error('ELEVEN_LABS_API_KEY is not configured');
    }
    
    const { text, voiceId } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating speech for text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    // Use the provided voice ID or fall back to default
    const selectedVoiceId = voiceId || DEFAULT_VOICE_ID;
    
    // Create a streaming response
    const stream = await elevenLabs.textToSpeech.convertAsStream(
      selectedVoiceId,
      {
        output_format: "mp3_44100_128",
        text: text,
        model_id: "eleven_flash_v2_5"
      }
    );
    
    // Return the audio stream directly to the client
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked'
      }
    });
    
  } catch (error) {
    console.error('Error in speak route:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate speech', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}