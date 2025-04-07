// import { WebSocketServer } from 'ws'
// import { NextResponse } from 'next/server'
// import { headers } from 'next/headers'

// const wss = new WebSocketServer({ noServer: true })

// // Store active connections
// const connections = new Map<string, WebSocket[]>()

// // Store session offers
// const offers = new Map<string, any>()

// wss.on('connection', (ws, request) => {
//   const sessionId = request.url?.split('?sessionId=')[1]
//   if (!sessionId) {
//     ws.close()
//     return
//   }

//   // Store the connection
//   if (!connections.has(sessionId)) {
//     connections.set(sessionId, [])
//   }
//   connections.get(sessionId)?.push(ws)

//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message.toString())
      
//       switch (data.type) {
//         case 'offer':
//           // Store the offer
//           offers.set(sessionId, data.offer)
//           // Forward to other peers
//           connections.get(sessionId)?.forEach(peer => {
//             if (peer !== ws) {
//               peer.send(JSON.stringify({
//                 type: 'offer',
//                 offer: data.offer
//               }))
//             }
//           })
//           break
          
//         case 'answer':
//           // Forward the answer to other peers
//           connections.get(sessionId)?.forEach(peer => {
//             if (peer !== ws) {
//               peer.send(JSON.stringify({
//                 type: 'answer',
//                 answer: data.answer
//               }))
//             }
//           })
//           break
          
//         case 'ice-candidate':
//           // Forward the ICE candidate to other peers
//           connections.get(sessionId)?.forEach(peer => {
//             if (peer !== ws) {
//               peer.send(JSON.stringify({
//                 type: 'ice-candidate',
//                 candidate: data.candidate
//               }))
//             }
//           })
//           break

//         case 'chat':
//           // Forward chat message to other peers
//           connections.get(sessionId)?.forEach(peer => {
//             if (peer !== ws) {
//               peer.send(JSON.stringify({
//                 type: 'chat',
//                 message: {
//                   ...data.message,
//                   sender: peer === ws ? "You" : "Other"
//                 }
//               }))
//             }
//           })
//           break
//       }
//     } catch (error) {
//       console.error('Error handling message:', error)
//     }
//   })

//   ws.on('close', () => {
//     const peers = connections.get(sessionId)
//     if (peers) {
//       const index = peers.indexOf(ws)
//       if (index > -1) {
//         peers.splice(index, 1)
//       }
//       if (peers.length === 0) {
//         connections.delete(sessionId)
//         offers.delete(sessionId)
//       }
//     }
//   })
// })

// export async function GET(req: Request) {
//   const headersList = headers()
//   const upgrade = headersList.get('upgrade')

//   if (!upgrade || upgrade.toLowerCase() !== 'websocket') {
//     return new NextResponse('Expected Upgrade: websocket', { status: 426 })
//   }

//   const { socket, response } = await new Promise<{ socket: any, response: Response }>((resolve) => {
//     wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
//       wss.emit('connection', ws, req)
//       resolve({ socket: ws, response: new NextResponse(null, { status: 101 }) })
//     })
//   })

//   return response
// } 