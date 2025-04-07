import { io, type Socket } from "socket.io-client"
import { EventEmitter } from "events"

class WebRTCService extends EventEmitter {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private dataChannel: RTCDataChannel | null = null
  private socket: Socket | null = null
  private roomId: string | null = null
  private userId: string | null = null

  constructor() {
    super()
  }

  // Initialize the service
  async initialize(roomId: string, userId: string) {
    this.roomId = roomId
    this.userId = userId

    // Initialize Socket.io connection
    await this.initializeSocket()

    // Configure ICE servers (STUN/TURN)
    this.peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        // In a production app, you would add TURN servers here
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
        },
      ],
    })

    // Set up event listeners
    this.setupPeerConnectionListeners()

    return this
  }

  // Initialize Socket.io connection
  private async initializeSocket() {
    // Initialize the socket connection
    await fetch("/api/socket")

    this.socket = io()

    // Join the room
    this.socket.emit("join-room", this.roomId, this.userId)

    // Handle WebRTC signaling
    this.socket.on("user-connected", (userId) => {
      console.log("User connected:", userId)
      this.emit("userConnected", userId)

      // If we're the initiator, create and send an offer
      if (this.peerConnection) {
        this.createOffer()
      }
    })

    this.socket.on("user-disconnected", (userId) => {
      console.log("User disconnected:", userId)
      this.emit("userDisconnected", userId)
    })

    this.socket.on("offer", async (userId, offer) => {
      if (userId !== this.userId && this.peerConnection) {
        await this.handleOffer(offer)

        // Create and send an answer
        const answer = await this.peerConnection.createAnswer()
        await this.peerConnection.setLocalDescription(answer)

        this.socket?.emit("answer", this.roomId, this.userId, answer)
      }
    })

    this.socket.on("answer", async (userId, answer) => {
      if (userId !== this.userId && this.peerConnection) {
        await this.handleAnswer(answer)
      }
    })

    this.socket.on("ice-candidate", async (userId, candidate) => {
      if (userId !== this.userId && this.peerConnection) {
        await this.addIceCandidate(candidate)
      }
    })

    this.socket.on("receive-message", (userId, message) => {
      this.emit("message", { userId, message })
    })
  }

  private setupPeerConnectionListeners() {
    if (!this.peerConnection) return

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket?.emit("ice-candidate", this.roomId, this.userId, event.candidate)
      }
    }

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.emit("connectionStateChange", this.peerConnection?.connectionState)
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = event.streams[0]
      this.emit("remoteStream", this.remoteStream)
    }

    // Handle data channel
    this.peerConnection.ondatachannel = (event) => {
      this.dataChannel = event.channel
      this.setupDataChannelListeners()
    }
  }

  private setupDataChannelListeners() {
    if (!this.dataChannel) return

    this.dataChannel.onopen = () => {
      this.emit("dataChannelOpen")
    }

    this.dataChannel.onclose = () => {
      this.emit("dataChannelClose")
    }

    this.dataChannel.onmessage = (event) => {
      this.emit("dataChannelMessage", event.data)
    }
  }

  // Initialize local media stream
  async initLocalStream(constraints: MediaStreamConstraints = { video: true, audio: true }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)

      // Add tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.peerConnection && this.localStream) {
            this.peerConnection.addTrack(track, this.localStream)
          }
        })
      }

      this.emit("localStream", this.localStream)
      return this.localStream
    } catch (error) {
      console.error("Error accessing media devices:", error)
      throw error
    }
  }

  // Create and send offer (caller)
  async createOffer() {
    if (!this.peerConnection) return null

    try {
      // Create data channel for text chat
      this.dataChannel = this.peerConnection.createDataChannel("chat")
      this.setupDataChannelListeners()

      // Create offer
      const offer = await this.peerConnection.createOffer()
      await this.peerConnection.setLocalDescription(offer)

      // Send offer via signaling server
      this.socket?.emit("offer", this.roomId, this.userId, offer)

      return offer
    } catch (error) {
      console.error("Error creating offer:", error)
      throw error
    }
  }

  // Handle incoming offer (callee)
  async handleOffer(offer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
    } catch (error) {
      console.error("Error handling offer:", error)
      throw error
    }
  }

  // Handle incoming answer (caller)
  async handleAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (error) {
      console.error("Error handling answer:", error)
      throw error
    }
  }

  // Add ICE candidate
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) return

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (error) {
      console.error("Error adding ICE candidate:", error)
      throw error
    }
  }

  // Send message via socket
  sendMessage(message: string) {
    this.socket?.emit("send-message", this.roomId, this.userId, message)
  }

  // Toggle audio
  toggleAudio(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled
      })
    }
  }

  // Close connection
  close() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
    }

    // Close data channel
    if (this.dataChannel) {
      this.dataChannel.close()
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close()
    }

    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect()
    }

    this.localStream = null
    this.remoteStream = null
    this.dataChannel = null
    this.peerConnection = null
    this.socket = null
  }
}

export default WebRTCService

