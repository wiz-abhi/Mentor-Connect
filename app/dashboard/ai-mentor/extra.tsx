'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mic, MicOff, Video, VideoOff, Send, Square } from 'lucide-react';
import { createAIChatSession, saveAIChatMessage } from '@/lib/db';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  emotion?: string;
  timestamp: string;
}

export default function AIMentorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI mentor. How can I help you today?',
      timestamp: new Date().toISOString(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Initialize video and audio
  useEffect(() => {
    if (isVideoEnabled) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(error => {
          console.error('Error accessing media devices:', error);
          toast({
            title: 'Error',
            description: 'Could not access camera or microphone',
            variant: 'destructive',
          });
        });
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isVideoEnabled, toast]);

  // Initialize chat session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Try to create a chat session, but continue even if it fails
        const sessionId = await createAIChatSession('user');
        sessionIdRef.current = sessionId;
      } catch (error) {
        console.error('Error initializing chat session:', error);
        // Continue without database persistence
        sessionIdRef.current = null;
      }
    };

    initializeSession();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false // Explicitly disable video for audio recording
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus'
        });
        await handleAudioInput(audioBlob);
      };

      // Set up data collection every 1 second
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      
      toast({
        title: 'Recording Started',
        description: 'Speak your message and click Stop when done.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: 'Error',
        description: 'Could not access microphone. Please check your permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast({
          title: 'Recording Stopped',
          description: 'Processing your message...',
          duration: 2000,
        });
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast({
          title: 'Error',
          description: 'Failed to stop recording',
          variant: 'destructive',
        });
      }
    }
  };

  const handleAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const transcribeResponse = await fetch('/api/ai-mentor/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!transcribeResponse.ok) {
        throw new Error('Failed to transcribe audio');
      }

      const transcribeData = await transcribeResponse.json();
      if (!transcribeData.text) {
        throw new Error('Failed to transcribe audio');
      }

      // Get AI response without adding user message (handleUserMessage will do that)
      await handleUserMessage(transcribeData.text);

    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to process audio',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = async (text: string) => {
    try {
      const response = await fetch('/api/ai-mentor/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate speech');
      }

      const data = await response.json();
      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        
        // Wait for the audio to be loaded before playing
        await new Promise((resolve, reject) => {
          audio.oncanplaythrough = resolve;
          audio.onerror = reject;
          audio.load();
        });

        await audio.play();
        
        // Wait for the audio to finish playing
        await new Promise(resolve => {
          audio.onended = resolve;
        });
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to play audio response',
        variant: 'destructive',
      });
    }
  };

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    try {
      // Add user message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput(''); // Clear input

      // Get AI response
      const response = await fetch('/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save messages to database if session exists
      if (sessionIdRef.current) {
        try {
          await saveAIChatMessage(sessionIdRef.current, userMessage.role, userMessage.content);
          await saveAIChatMessage(sessionIdRef.current, aiMessage.role, aiMessage.content);
        } catch (error) {
          console.error('Error saving messages to database:', error);
        }
      }
      
      // Speak the response
      await speakResponse(aiMessage.content);
      
      return aiMessage;
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left side - Chat interface */}
      <div className="w-1/2 p-4 flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{message.content}</p>
                  <span className="text-xs opacity-70">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant={isRecording ? "default" : "outline"}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isLoading}
            className="flex-none"
          >
            {isRecording ? (
              <>
                <Square className="h-4 w-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Mic className="h-4 w-4 mr-2" />
                Record
              </>
            )}
          </Button>
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const content = input.trim();
                if (content) {
                  handleUserMessage(content);
                }
              }
            }}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            onClick={() => {
              const content = input.trim();
              if (content) {
                handleUserMessage(content);
              }
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Right side - Video feed */}
      <div className="w-1/2 p-4">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Video Feed</h2>
            <Button
              variant={isVideoEnabled ? "default" : "outline"}
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              size="sm"
            >
              {isVideoEnabled ? (
                <>
                  <VideoOff className="h-4 w-4 mr-2" />
                  Disable Camera
                </>
              ) : (
                <>
                  <Video className="h-4 w-4 mr-2" />
                  Enable Camera
                </>
              )}
            </Button>
          </div>
          <div className="flex-1 relative">
            {isVideoEnabled ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover rounded-b-lg"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                <p className="text-gray-500">Camera is disabled</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}