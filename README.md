# WebSocket Server for SFA Mirror

This WebSocket server enables real-time screen mirroring functionality between the SFA (Sales Force Automation) app and the Mirror app.

## Features

- Session management with unique room codes
- Real-time customer data synchronization
- Connection state handling
- Error management and logging
- Automatic session cleanup

## Message Types

### 1. CREATE_SESSION
Creates a new mirroring session.
```json
{
  "type": "CREATE_SESSION"
}
```

### 2. JOIN_SESSION
Joins an existing session using a session ID.
```json
{
  "type": "JOIN_SESSION",
  "sessionId": "ABC123"
}
```

### 3. VIEW_CUSTOMER
Updates customer data for all connected clients in a session.
```json
{
  "type": "VIEW_CUSTOMER",
  "sessionId": "ABC123",
  "payload": {
    "customerInfo": { /* customer data */ }
  }
}
```

### 4. REQUEST_CUSTOMER_UPDATE
Requests the current customer data for a session.
```json
{
  "type": "REQUEST_CUSTOMER_UPDATE",
  "sessionId": "ABC123"
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Error Handling

The server handles various error scenarios:
- Invalid session IDs
- Malformed messages
- Connection issues
- Session cleanup

Error messages are sent to clients in the following format:
```json
{
  "type": "ERROR",
  "payload": {
    "message": "Error description"
  }
}
```

## Monitoring

The server logs:
- New connections
- Disconnections
- Message processing
- Session creation/deletion
- Active sessions (every 30 seconds)

## Security Notes

- Session IDs are randomly generated 6-character strings
- Each session maintains its own isolated set of clients
- Messages are only broadcast within their respective sessions
- Invalid sessions are rejected immediately

## Deployment

### Railway Deployment

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Deploy the project
4. Get your WebSocket URL from Railway (e.g., `wss://your-app.up.railway.app`)
5. Update the `WS_URL` constant in both SFA and Mirror apps with your Railway WebSocket URL

## WebSocket Protocol

### Message Format

All messages follow this format:
```typescript
{
  sessionId: string;  // Room code for the session
  type: string;      // Message type (e.g., 'VIEW_CUSTOMER')
  payload: any;      // Message data
}
```

### Message Types

1. Session Management:
   - `CREATE_SESSION`: Create a new session
   - `SESSION_CREATED`: Response with new session ID
   - `JOIN_SESSION`: Join an existing session
   - `SESSION_JOINED`: Confirmation of successful join

2. State Synchronization:
   - `VIEW_CUSTOMER`: Update customer being viewed
   - `VIEW_PRODUCT`: Update product being viewed

## Development

To run the server locally:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the server: `npm start`
4. Connect to `ws://localhost:3000` 