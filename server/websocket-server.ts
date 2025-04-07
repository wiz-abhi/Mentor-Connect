import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { parse } from 'url';
import { query } from '../lib/db';
import dotenv from 'dotenv';

dotenv.config();

// Store active connections
const connections = new Map<string, WebSocket>();

// Create HTTP server
const server = createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Handle WebSocket connections
wss.on('connection', (ws: WebSocket, req) => {
  const { query: queryParams } = parse(req.url || '', true);
  const sessionId = queryParams.sessionId as string;
  const userId = queryParams.userId as string;

  if (!sessionId || !userId) {
    console.error('Missing sessionId or userId');
    ws.close();
    return;
  }

  // Store the connection
  const connectionId = `${sessionId}-${userId}`;
  connections.set(connectionId, ws);

  console.log(`New connection: ${connectionId}`);

  // Notify other participants in the session
  broadcastToSession(sessionId, userId, {
    type: 'user-joined',
    userId,
    timestamp: new Date().toISOString()
  });

  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          // Forward WebRTC signaling messages
          const targetConnectionId = `${sessionId}-${message.targetUserId}`;
          const targetConnection = connections.get(targetConnectionId);
          if (targetConnection) {
            targetConnection.send(JSON.stringify({
              ...message,
              senderId: userId
            }));
          }
          break;

        case 'chat':
          // Save chat message to database
          await saveChatMessage(sessionId, userId, message.content);
          
          // Broadcast chat message to all participants
          broadcastToSession(sessionId, userId, {
            type: 'chat',
            userId,
            content: message.content,
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Handle disconnection
  ws.on('close', () => {
    connections.delete(connectionId);
    console.log(`Connection closed: ${connectionId}`);
    
    // Notify other participants
    broadcastToSession(sessionId, userId, {
      type: 'user-left',
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connections.delete(connectionId);
  });
});

// Helper function to broadcast messages to all participants in a session
function broadcastToSession(sessionId: string, senderId: string, message: any) {
  connections.forEach((ws, connectionId) => {
    if (connectionId.startsWith(sessionId) && !connectionId.endsWith(senderId)) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Helper function to save chat messages to the database
async function saveChatMessage(sessionId: string, userId: string, content: string) {
  try {
    await query(
      'INSERT INTO chat_messages (session_id, user_id, message) VALUES ($1, $2, $3)',
      [sessionId, userId, content]
    );
  } catch (error) {
    console.error('Error saving chat message:', error);
  }
}

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
}); 