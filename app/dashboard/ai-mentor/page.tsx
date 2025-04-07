'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
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

interface FacialExpressions {
  emotions: Array<{
    name: string;
    score: number;
  }>;
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
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [facialExpressions, setFacialExpressions] = useState<FacialExpressions | null>(null);
  const [currentEmotions, setCurrentEmotions] = useState<Array<{name: string, score: number}> | null>(null);
  const [dominantEmotion, setDominantEmotion] = useState<string>('');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasVideoPermission, setHasVideoPermission] = useState(false);
  const { toast } = useToast();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const humeApiKey = process.env.NEXT_PUBLIC_HUME_API_KEY || '';

  // Initialize chat session
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const sessionId = await createAIChatSession('user');
        sessionIdRef.current = sessionId;
      } catch (error) {
        console.error('Error initializing chat session:', error);
        sessionIdRef.current = null;
      }
    };

    initializeSession();
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup function for camera and intervals
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    };
  }, [videoStream]);

  // Handle video ref and stream connection
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Add this useEffect for periodic emotion analysis
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isCameraOn && videoRef.current) {
      // Initial analysis
      captureAndAnalyzeFrame();
      
      // Set up interval for periodic analysis
      intervalId = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 5000); // Every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCameraOn, videoRef.current]);

  const captureAndAnalyzeFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isCameraOn || !videoStream) return;
    
    try {
      setIsAnalyzing(true);
      console.log("Starting facial analysis...");
      
      // Capture frame from video
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
      });
      
      if (!blob) return;
      console.log("Image captured, size:", blob.size, "bytes");
      
      // Create a File object from the blob
      const file = new File([blob], "frame.jpg", { type: "image/jpeg" });
      
      // Start inference job
      console.log("Starting inference job...");
      const formData = new FormData();
      formData.append('file', file);
      formData.append('json', JSON.stringify({
        models: { face: {} }
      }));
      
      const jobResponse = await fetch('https://api.hume.ai/v0/batch/jobs', {
        method: 'POST',
        headers: { 'X-Hume-Api-Key': humeApiKey },
        body: formData,
      });
      
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error("Job creation error:", errorText);
        throw new Error(`API error: ${jobResponse.status}`);
      }
      
      const jobData = await jobResponse.json();
      const jobId = jobData.job_id;
      console.log("Job created with ID:", jobId);
      
      // Poll for job completion
      let jobStatus = 'RUNNING';
      let attempts = 0;
      const maxAttempts = 30; // Maximum polling attempts
      
      console.log("Polling for job completion...");
      while (jobStatus === 'RUNNING' && attempts < maxAttempts) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const statusResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
          method: 'GET',
          headers: { 'X-Hume-Api-Key': humeApiKey },
        });
        
        if (!statusResponse.ok) {
          console.error("Status check failed:", await statusResponse.text());
          break;
        }
        
        const statusData = await statusResponse.json();
        jobStatus = statusData.state?.status || statusData.status;
        console.log(`Job status (attempt ${attempts}): ${jobStatus}`);
        
        if (jobStatus === 'COMPLETED') {
          console.log("Job completed, waiting before fetching predictions...");
          // Add a small delay to ensure predictions are ready
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try up to 3 times to get predictions
          let predictionsFound = false;
          for (let predAttempt = 1; predAttempt <= 3; predAttempt++) {
            console.log(`Fetching predictions (attempt ${predAttempt})...`);
            
            const predictionsResponse = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
              method: 'GET',
              headers: { 
                'X-Hume-Api-Key': humeApiKey,
                'accept': 'application/json; charset=utf-8'
              },
            });
            
            if (!predictionsResponse.ok) {
              console.error(`Predictions fetch failed (attempt ${predAttempt}):`, await predictionsResponse.text());
              if (predAttempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
              break;
            }
            
            const predictions = await predictionsResponse.json();
            console.log(`Predictions response (attempt ${predAttempt}):`, predictions);
            
            if (predictions && Array.isArray(predictions) && predictions.length > 0) {
              console.log("Processing predictions structure...");
              
              // Check if we have predictions array in the results
              if (predictions[0].results?.predictions && 
                  Array.isArray(predictions[0].results.predictions) && 
                  predictions[0].results.predictions.length > 0) {
                
                // Get the first prediction which contains the file data
                const filePrediction = predictions[0].results.predictions[0];
                console.log("File prediction:", filePrediction);
                
                // Check if we have face model results with grouped_predictions
                if (filePrediction.models?.face?.grouped_predictions && 
                    filePrediction.models.face.grouped_predictions.length > 0 &&
                    filePrediction.models.face.grouped_predictions[0].predictions &&
                    filePrediction.models.face.grouped_predictions[0].predictions.length > 0) {
                  
                  // Extract the emotions array from the first prediction
                  const emotions = filePrediction.models.face.grouped_predictions[0].predictions[0].emotions;
                  
                  if (emotions && emotions.length > 0) {
                    console.log("Emotions found:", emotions.length, "emotions");
                    setFacialExpressions({ emotions });
                    setCurrentEmotions(emotions);
                    
                    // Find and set dominant emotion
                    if (emotions && emotions.length > 0) {
                      const dominant = emotions.reduce((max: { name: string; score: number }, emotion: { name: string; score: number }) => 
                        emotion.score > max.score ? emotion : max
                      );
                      setDominantEmotion(dominant.name);
                    }
                    
                    predictionsFound = true;
                  } else {
                    console.log("No emotions array in the prediction");
                  }
                  
                  break;
                } else {
                  console.log("No grouped_predictions in face model results");
                }
              }
            }
            
            if (predAttempt < 3 && !predictionsFound) {
              console.log("Waiting before retrying predictions...");
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          if (!predictionsFound) {
            console.log("Failed to get valid predictions after multiple attempts");
          }
          
          break;
        } else if (jobStatus === 'FAILED') {
          console.error("Job failed");
          break;
        }
      }
      
      if (attempts >= maxAttempts) {
        console.log("Max polling attempts reached");
      }
      
    } catch (error) {
      console.error('Error analyzing facial expressions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoRef, canvasRef, isCameraOn, videoStream, humeApiKey]);

  const toggleCamera = async () => {
    if (isCameraOn) {
      // Turn off camera
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        setVideoStream(null);
      }
      setIsCameraOn(false);
      
      // Stop the analysis interval
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    } else {
      // Turn on camera
      try {
        setCameraError(null);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false
        });
        
        setVideoStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        setIsCameraOn(true);
        setHasVideoPermission(true);
        
        // Initial emotion capture when camera starts
        captureAndAnalyzeFrame();
        
      } catch (err) {
        setHasVideoPermission(false);
        setCameraError('Could not access camera. Please check permissions.');
        toast({
          title: 'Camera Error',
          description: 'Could not access camera. Please check permissions.',
          variant: 'destructive',
        });
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false
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
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus'
        });
        await handleAudioInput(audioBlob);
      };

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
    let audioUrl: string | null = null;
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

      // Get the audio blob from the response
      const audioBlob = await response.blob();
      
      // Create a URL for the blob
      audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play the audio
      const audio = new Audio(audioUrl);
      
      // Clean up the URL after playing or if there's an error
      const cleanup = () => {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
          audioUrl = null;
        }
      };
      
      audio.onended = cleanup;
      audio.onerror = cleanup;
      
      // Play the audio
      await audio.play();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: 'Error',
        description: 'Failed to play audio response',
        variant: 'destructive',
      });
    } finally {
      // Ensure cleanup happens even if there's an error
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    }
  };

  const handleUserMessage = async (content: string) => {
    if (!content.trim()) return;
    
    setIsLoading(true);
    try {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: content.trim(),
        emotion: dominantEmotion || undefined,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInput('');

      // Get AI response with emotion context
      const response = await fetch('/api/ai-mentor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          emotion: dominantEmotion || undefined
        }),
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
      await speakResponse(aiMessage.content);
      
      if (sessionIdRef.current) {
        try {
          await saveAIChatMessage(
            sessionIdRef.current, 
            userMessage.role, 
            userMessage.content,
          );
          await saveAIChatMessage(
            sessionIdRef.current, 
            aiMessage.role, 
            aiMessage.content
          );
        } catch (error) {
          console.error('Error saving messages to database:', error);
        }
      }
      
      
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

  // Add this function to get top 5 emotions
  const getTopEmotions = () => {
    if (!currentEmotions) return [];
    return [...currentEmotions]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
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
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs opacity-70">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                    {message.emotion && (
                      <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                        {message.emotion}
                      </span>
                    )}
                  </div>
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
              variant={isCameraOn ? "default" : "outline"}
              onClick={toggleCamera}
              size="sm"
              disabled={isAnalyzing}
            >
              {isCameraOn ? (
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
            {isCameraOn ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-b-lg"
                />
                <canvas
                  ref={canvasRef}
                  className="hidden"
                />
                {isAnalyzing && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white p-2 rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs ml-2">Analyzing...</span>
                  </div>
                )}
                {currentEmotions && (
                  <div className="absolute bottom-4 left-4 bg-black/70 text-white p-3 rounded-lg">
                    <h3 className="font-semibold mb-2">Current Emotions</h3>
                    <div className="space-y-1">
                      {getTopEmotions().map((emotion) => (
                        <div key={emotion.name} className="flex justify-between items-center">
                          <span className="text-sm">{emotion.name}</span>
                          <span className="text-xs">{(emotion.score * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                <p className="text-gray-500">
                  {cameraError || "Camera is disabled"}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}