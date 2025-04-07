"use client"

import { useState, useRef, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mic, MicOff, Video, VideoOff, MessageSquare, Send, PhoneOff, Maximize2, Minimize2 } from "lucide-react"
import { format } from "date-fns"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

interface Message {
  id: string
  sender: string
  content: string
  timestamp: string
}

interface ConferenceRoomProps {
  sessionId: string
}

const ConferenceRoom = ({ sessionId }: ConferenceRoomProps) => {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'waiting'>('waiting')
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const chatRef = useRef<HTMLDivElement>(null)

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user?.id) {
      router.push('/login')
      return
    }

    const connectWebSocket = () => {
      const websocket = new WebSocket(`wss://mentor-server-a2zn.onrender.com/ws?sessionId=${sessionId}&userId=${user.id}`)

      websocket.onopen = () => {
        console.log("WebSocket connection established")
        setConnectionStatus('connected')
        setReconnectAttempts(0)
        
        // Start sending heartbeats
        heartbeatIntervalRef.current = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({ type: 'heartbeat' }))
          }
        }, 20000) // Send heartbeat every 20 seconds
      }

      websocket.onclose = (event) => {
        console.log("WebSocket connection closed", event.code, event.reason)
        setConnectionStatus('waiting')
        
        // Clear heartbeat interval
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
          heartbeatIntervalRef.current = null
        }

        // Implement exponential backoff for reconnection
        const maxAttempts = 5
        if (reconnectAttempts < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000) // Max 30 seconds
          console.log(`Attempting to reconnect in ${delay/1000} seconds...`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connectWebSocket()
          }, delay)
        } else {
          toast({
            variant: "destructive",
            title: "Connection Error",
            description: "Unable to establish connection. Please try refreshing the page.",
          })
        }
      }

      websocket.onerror = (error) => {
        console.log("WebSocket error:", error)
        if (connectionStatus !== 'waiting') {
          setConnectionStatus('waiting')
        }
      }

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        
        if (message.type === 'no-participant') {
          setConnectionStatus('waiting')
          return
        }

        if (message.type === 'chat') {
          setMessages(prev => [...prev, message])
        }
      }

      setWs(websocket)
    }

    connectWebSocket()

    return () => {
      // Cleanup
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (ws) {
        ws.close()
      }
    }
  }, [sessionId, user?.id, router, reconnectAttempts, toast])

  // Initialize video call
  useEffect(() => {
    if (!user?.id) return

    const startVideoCall = async () => {
      try {
        setIsConnecting(true)
        setConnectionStatus('connecting')

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        const configuration = {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }

        const peerConnection = new RTCPeerConnection(configuration)
        peerConnectionRef.current = peerConnection

        // Add all tracks from the stream
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream)
        })

        // Handle incoming tracks
        peerConnection.ontrack = (event) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0]
          }
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
          if (event.candidate && ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate
            }))
          }
        }

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
          switch (peerConnection.connectionState) {
            case 'connected':
              setConnectionStatus('connected')
              setIsConnecting(false)
              break
            case 'disconnected':
            case 'failed':
              setConnectionStatus('waiting')
              setIsConnecting(false)
              break
          }
        }

        // Create and send offer
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'offer', offer }))
        }

      } catch (error) {
        console.error("Error starting video call:", error)
        setIsConnecting(false)
        setConnectionStatus('waiting')
        toast({
          variant: "destructive",
          title: "Error starting video call",
          description: "Failed to start the video call. Please check your camera and microphone permissions.",
        })
      }
    }

    startVideoCall()

    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
      }
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [user?.id, ws, toast])

  // Handle WebSocket messages
  useEffect(() => {
    if (!ws) return

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      if (message.type === 'no-participant') {
        setConnectionStatus('waiting')
        return
      }

      if (message.type === 'chat') {
        setMessages(prev => [...prev, message.message])
        return
      }

      if (!peerConnectionRef.current) return

      switch (message.type) {
        case 'offer':
          handleOffer(message.offer)
          break
        case 'answer':
          handleAnswer(message.answer)
          break
        case 'ice-candidate':
          handleIceCandidate(message.candidate)
          break
      }
    }
  }, [ws])

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)
      
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'answer', answer }))
      }
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const sendMessage = () => {
    if (newMessage.trim() && ws?.readyState === WebSocket.OPEN) {
      const message = {
        id: Date.now().toString(),
        sender: user?.full_name || "You",
        content: newMessage,
        timestamp: new Date().toISOString()
      }
      ws.send(JSON.stringify({
        type: 'chat',
        message
      }))
      setMessages(prev => [...prev, message])
      setNewMessage("")
    }
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div className="flex h-screen bg-background">
      {/* Main Video Area */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Local Video Preview */}
        <div className="absolute bottom-4 right-4 w-64 h-36 bg-black rounded-lg overflow-hidden">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Controls */}
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
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="rounded-full"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={() => router.push("/dashboard/upcoming")}
            className="rounded-full"
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>

        {/* Connection Status */}
        <div className="absolute top-4 left-4">
          <div className={`px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-500/20 text-green-500' :
            connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-500' :
            connectionStatus === 'waiting' ? 'bg-blue-500/20 text-blue-500' :
            'bg-red-500/20 text-red-500'
          }`}>
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'connecting' ? 'Connecting...' :
             connectionStatus === 'waiting' ? 'Waiting for participant...' :
             'Disconnected'}
          </div>
        </div>
      </div>

      {/* Chat Panel */}
      <div className="w-80 border-l bg-background flex flex-col">
        <div className="p-4 border-b flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h2 className="font-semibold">Chat</h2>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={chatRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{message.sender}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.timestamp), "h:mm a")}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t flex gap-2">
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button size="icon" onClick={sendMessage}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConferenceRoom