const WebSocket = require('ws');
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ port: PORT });

// Store active sessions and their clients
let sessions = new Map(); // { sessionId: { clients: Set<WebSocket>, customerData: Object } }

// Generate a random session ID
function generateSessionId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Send message to all clients in a session except the sender
function broadcastToSession(sessionId, message, sender) {
  const session = sessions.get(sessionId);
  if (session) {
    session.clients.forEach(client => {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

wss.on('connection', function connection(ws) {
  console.log('New client connected');
  let clientSessionId = null;

  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      const { sessionId, type, payload } = data;

      console.log('Received message:', { type, sessionId });

      switch (type) {
        case 'CREATE_SESSION':
          // Generate new session ID and create session
          clientSessionId = generateSessionId();
          sessions.set(clientSessionId, {
            clients: new Set([ws]),
            customerData: null
          });
          ws.send(JSON.stringify({
            type: 'SESSION_CREATED',
            payload: { sessionId: clientSessionId }
          }));
          console.log('Created new session:', clientSessionId);
          break;

        case 'JOIN_SESSION':
          // Join existing session
          if (!sessionId) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Session ID is required' }
            }));
            return;
          }

          const session = sessions.get(sessionId);
          if (!session) {
            ws.send(JSON.stringify({
              type: 'ERROR',
              payload: { message: 'Invalid session ID' }
            }));
            return;
          }

          clientSessionId = sessionId;
          session.clients.add(ws);
          ws.send(JSON.stringify({
            type: 'SESSION_JOINED',
            payload: { sessionId }
          }));

          // Send current customer data if available
          if (session.customerData) {
            ws.send(JSON.stringify({
              type: 'VIEW_CUSTOMER',
              payload: session.customerData
            }));
          }
          console.log('Client joined session:', sessionId);
          break;

        case 'VIEW_CUSTOMER':
          // Update and broadcast customer data
          if (!sessionId || !sessions.has(sessionId)) {
            console.log('Invalid session for customer data:', sessionId);
            return;
          }

          const sessionData = sessions.get(sessionId);
          sessionData.customerData = payload;
          broadcastToSession(sessionId, { type, payload }, ws);
          console.log('Updated customer data for session:', sessionId);
          break;

        case 'REQUEST_CUSTOMER_UPDATE':
          // Handle request for current customer data
          if (!sessionId || !sessions.has(sessionId)) {
            console.log('Invalid session for customer data request:', sessionId);
            return;
          }

          const currentSession = sessions.get(sessionId);
          if (currentSession.customerData) {
            ws.send(JSON.stringify({
              type: 'VIEW_CUSTOMER',
              payload: currentSession.customerData
            }));
          }
          break;

        default:
          console.log('Unknown message type:', type);
          break;
      }
    } catch (err) {
      console.error('Error handling message:', err);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: { message: 'Invalid message format' }
      }));
    }
  });

  ws.on('close', () => {
    if (clientSessionId && sessions.has(clientSessionId)) {
      const session = sessions.get(clientSessionId);
      session.clients.delete(ws);

      // Clean up session if no clients left
      if (session.clients.size === 0) {
        sessions.delete(clientSessionId);
        console.log('Session cleaned up:', clientSessionId);
      }
    }
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Log active sessions periodically
setInterval(() => {
  console.log('Active sessions:', {
    count: sessions.size,
    sessions: Array.from(sessions.keys())
  });
}, 30000);

console.log(`WebSocket server running on ws://localhost:${PORT}`); 