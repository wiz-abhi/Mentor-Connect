"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Mic, MicOff, Video, VideoOff, Phone, MessageSquare, Share } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import WebRTCService from "@/lib/webrtc-service"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

type Message = {
  id: string
  sender: string
  content: string
  timestamp: Date
}

export default function SessionPage({ params }: { params: { id: string } }) {
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isConnecting, setIsConnecting] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const webrtcServiceRef = useRef<WebRTCService | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const { user } = useAuth()
  const { toast } = useToast()

  const sessionId = params.id
  const [sessionData, setSessionData] = useState<any>(null)
  const [otherParticipant, setOtherParticipant] = useState<any>(null)

  useEffect(() => {
    // Fetch session data
    const fetchSessionData = async () => {
      try {
        const { data, error } = await supabase
          .from("mentorship_sessions")
          .select(`
            *,
            mentor:mentor_id(id, full_name, avatar_url),
            mentee:mentee_id(id, full_name, avatar_url)
          `)
          .eq("id", sessionId)
          .single()

        if (error) throw error

        setSessionData(data)

        // Determine other participant
        if (user?.id === data.mentor_id) {
          setOtherParticipant(data.mentee)
        } else {
          setOtherParticipant(data.mentor)
        }

        // Add welcome message
        setMessages([
          {
            id: "1",
            sender: data.mentor.full_name,
            content: `Hello! Welcome to our mentorship session on ${data.topic}. What would you like to focus on today?`,
            timestamp: new Date(),
          },
        ])
      } catch (error) {
        console.error("Error fetching session data:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load session data",
        })
      }
    }

    if (user) {
      fetchSessionData()
    }
  }, [sessionId, user, toast])

  useEffect(() => {
    // Initialize WebRTC
    const initializeWebRTC = async () => {
      if (!user || !sessionData) return

      try {
        setIsConnecting(true)

        // Initialize WebRTC service
        const webrtcService = new WebRTCService()
        await webrtcService.initialize(sessionId, user.id)
        webrtcServiceRef.current = webrtcService

        // Initialize local stream
        const localStream = await webrtcService.initLocalStream()
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream
        }

        // Set up event listeners
        webrtcService.on("remoteStream", (stream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream
            setIsConnecting(false)
          }
        })

        webrtcService.on("connectionStateChange", (state) => {
          console.log("Connection state changed:", state)
          if (state === "connected") {
            setIsConnecting(false)
          } else if (state === "disconnected" || state === "failed") {
            toast({
              variant: "destructive",
              title: "Connection Lost",
              description: "The connection to the other participant was lost. Trying to reconnect...",
            })
          }
        })

        webrtcService.on("message", ({ userId, message }) => {
          // Add message to chat
          const sender = userId === user.id ? "You" : otherParticipant?.full_name || "Other"

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              sender,
              content: message,
              timestamp: new Date(),
            },
          ])
        })

        // Create offer if we're the mentor
        if (user.id === sessionData.mentor_id) {
          await webrtcService.createOffer()
        }

        // Update session status
        await supabase
          .from("mentorship_sessions")
          .update({
            status: "in_progress",
          })
          .eq("id", sessionId)
      } catch (error) {
        console.error("Error initializing WebRTC:", error)
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to establish video connection. Please try refreshing the page.",
        })
      }
    }

    initializeWebRTC()

    return () => {
      // Clean up WebRTC
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.close()
      }
    }
  }, [sessionId, user, sessionData, otherParticipant, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleMic = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleAudio(!isMicOn)
      setIsMicOn(!isMicOn)
    }
  }

  const toggleVideo = () => {
    if (webrtcServiceRef.current) {
      webrtcServiceRef.current.toggleVideo(!isVideoOn)
      setIsVideoOn(!isVideoOn)
    }
  }

  const endCall = async () => {
    try {
      // Stop recording if active
      if (isRecording) {
        await stopRecording()
      }

      // Update session status
      await supabase
        .from("mentorship_sessions")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
        })
        .eq("id", sessionId)

      // Close WebRTC connection
      if (webrtcServiceRef.current) {
        webrtcServiceRef.current.close()
      }

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      console.error("Error ending call:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end session properly",
      })
    }
  }

  const handleSendMessage = () => {
    if (input.trim() === "" || !webrtcServiceRef.current) return

    // Send message via WebRTC
    webrtcServiceRef.current.sendMessage(input)

    // Add message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "You",
        content: input,
        timestamp: new Date(),
      },
    ])

    setInput("")
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const startRecording = () => {
    if (!webrtcServiceRef.current || !localVideoRef.current?.srcObject) return

    try {
      const stream = localVideoRef.current.srcObject as MediaStream

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      })

      // Set up event listeners
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Start recording
      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      toast({
        title: "Recording Started",
        description: "The session is now being recorded",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: "Failed to start recording",
      })
    }
  }

  const stopRecording = async () => {
    if (!mediaRecorderRef.current || !isRecording) return

    return new Promise<void>((resolve, reject) => {
      mediaRecorderRef.current!.onstop = async () => {
        try {
          // Create a single Blob from all the chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
          audioChunksRef.current = []

          // Upload to server for transcription
          const formData = new FormData()
          formData.append("audio", audioBlob)
          formData.append("sessionId", sessionId)

          const response = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to transcribe audio")
          }

          const { transcription } = await response.json()

          // Update session with transcript
          await supabase
            .from("mentorship_sessions")
            .update({
              transcript_url: transcription, // In a real app, this would be a URL to the stored transcript
            })
            .eq("id", sessionId)

          toast({
            title: "Recording Processed",
            description: "Session recording has been transcribed and saved",
          })

          setIsRecording(false)
          resolve()
        } catch (error) {
          console.error("Error processing recording:", error)
          toast({
            variant: "destructive",
            title: "Processing Error",
            description: "Failed to process recording",
          })
          setIsRecording(false)
          reject(error)
        }
      }

      mediaRecorderRef.current!.onerror = (event) => {
        reject(event.error)
      }

      // Stop recording
      mediaRecorderRef.current!.stop()
    })
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!sessionData) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading session...</h2>
          <p className="text-muted-foreground">Please wait while we connect you to your mentor</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mentorship Session: {sessionData.topic}</h1>
        <p className="text-muted-foreground">With {otherParticipant?.full_name || "your mentor"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-black">
                {/* Remote video (other participant) */}
                <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-cover" />

                {isConnecting && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                      <p>Connecting to your session...</p>
                    </div>
                  </div>
                )}

                {/* Local video (user) - small overlay */}
                <div className="absolute bottom-4 right-4 h-1/4 w-1/4 overflow-hidden rounded-lg border-2 border-background bg-muted">
                  <video ref={localVideoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  {!isVideoOn && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
                      <VideoOff className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Call controls */}
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 transform items-center gap-4 rounded-full bg-background/80 p-2 backdrop-blur">
                  <Button
                    variant={isMicOn ? "outline" : "destructive"}
                    size="icon"
                    onClick={toggleMic}
                    className="rounded-full"
                  >
                    {isMicOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isVideoOn ? "outline" : "destructive"}
                    size="icon"
                    onClick={toggleVideo}
                    className="rounded-full"
                  >
                    {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleRecording}
                    className="rounded-full"
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                  >
                    <span
                      className={`h-3 w-3 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`}
                    ></span>
                  </Button>
                  <Button variant="destructive" size="icon" onClick={endCall} className="rounded-full">
                    <Phone className="h-4 w-4 rotate-135" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Tabs defaultValue="chat">
            <TabsList className="w-full">
              <TabsTrigger value="chat" className="flex-1">
                <MessageSquare className="mr-2 h-4 w-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                <Share className="mr-2 h-4 w-4" />
                Session Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {message.sender === "You"
                                ? "ME"
                                : message.sender
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                            </AvatarFallback>
                            <AvatarImage src="/placeholder.svg?height=32&width=32" />
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{message.sender}</span>
                              <span className="text-xs text-muted-foreground">
                                {message.timestamp.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-sm">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="mt-4 flex items-center gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                    <Button onClick={handleSendMessage} disabled={input.trim() === ""}>
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium">Session Summary</h3>
                      <p className="text-sm text-muted-foreground">
                        {sessionData.topic}: {sessionData.notes || "No summary available yet."}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium">Key Points</h3>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground">
                        <li>Topic 1</li>
                        <li>Topic 2</li>
                        <li>Topic 3</li>
                        <li>Topic 4</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-medium">Resources</h3>
                      <ul className="ml-6 list-disc text-sm text-muted-foreground">
                        <li>Resource 1</li>
                        <li>Resource 2</li>
                        <li>Resource 3</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

