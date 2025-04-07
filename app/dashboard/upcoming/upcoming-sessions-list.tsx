"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Video, MessageSquare, Mic, MicOff, VideoOff, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/components/ui/use-toast"

interface Session {
  id: string
  start_time: string
  end_time: string | null
  status: string
  topic: string
  mentor: {
    id: string
    full_name: string
    avatar_url: string | null
    expertise: string[]
  }
  mentee: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface UpcomingSessionsListProps {
  sessions: Session[]
  userType: 'mentor' | 'mentee'
}

export default function UpcomingSessionsList({ sessions, userType }: UpcomingSessionsListProps) {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()

  const connectToSignalingServer = (sessionId: string) => {
    try {
      const ws = new WebSocket(`ws://${window.location.host}/api/ws?sessionId=${sessionId}`)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Connected to signaling server')
        setConnectionStatus('connected')
      }

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'offer':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer))
              const answer = await peerConnectionRef.current.createAnswer()
              await peerConnectionRef.current.setLocalDescription(answer)
              ws.send(JSON.stringify({ type: 'answer', answer }))
            }
            break
          
          case 'answer':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer))
            }
            break
          
          case 'ice-candidate':
            if (peerConnectionRef.current) {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate))
            }
            break
        }
      }

      ws.onclose = () => {
        console.log('Disconnected from signaling server')
        setConnectionStatus('disconnected')
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (activeSession) {
            connectToSignalingServer(activeSession)
          }
        }, 5000)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Failed to connect to the signaling server. Attempting to reconnect...",
        })
      }
    } catch (error) {
      console.error('Error connecting to signaling server:', error)
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Failed to connect to the signaling server. Please try again later.",
      })
    }
  }

  const startVideoCall = async (sessionId: string) => {
    window.location.href = `/dashboard/conference/${sessionId}`
  }

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const audioTrack = stream.getAudioTracks()[0]
      audioTrack.enabled = !audioTrack.enabled
      setIsMicOn(audioTrack.enabled)
    }
  }

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream
      const videoTrack = stream.getVideoTracks()[0]
      videoTrack.enabled = !videoTrack.enabled
      setIsVideoOn(videoTrack.enabled)
    }
  }

  useEffect(() => {
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No upcoming sessions</h3>
          <p className="text-muted-foreground text-center mt-2">
            {userType === 'mentor'
              ? "You don't have any upcoming sessions with mentees."
              : "You don't have any upcoming sessions with mentors."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{session.topic}</CardTitle>
              <Badge variant="outline">{session.status}</Badge>
            </div>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4" />
                <span>
                  {userType === 'mentor'
                    ? `Mentee: ${session.mentee.full_name}`
                    : `Mentor: ${session.mentor.full_name}`}
                </span>
              </div>
              {userType === 'mentee' && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {session.mentor.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(session.start_time), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(session.start_time), "h:mm a")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button variant="outline" size="sm">
              Reschedule
            </Button>
            <Button 
              size="sm" 
              onClick={() => startVideoCall(session.id)}
              disabled={isConnecting}
            >
              <Video className="h-4 w-4 mr-2" />
              {isConnecting ? 'Connecting...' : 'Join Session'}
            </Button>
          </CardFooter>
        </Card>
      ))}

      {/* Video Call Modal */}
      {activeSession && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-background rounded-lg p-4 w-full max-w-4xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
                  {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                </Badge>
                {connectionStatus === 'disconnected' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startVideoCall(activeSession)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Reconnect
                  </Button>
                )}
              </div>
              <Button
                variant="destructive"
                onClick={() => {
                  setActiveSession(null)
                  if (peerConnectionRef.current) {
                    peerConnectionRef.current.close()
                  }
                  if (wsRef.current) {
                    wsRef.current.close()
                  }
                  if (localVideoRef.current?.srcObject) {
                    const stream = localVideoRef.current.srcObject as MediaStream
                    stream.getTracks().forEach(track => track.stop())
                  }
                }}
              >
                End Call
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
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
                </div>
              </div>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 