# 🎙️ Voice Agent Simulation — Assessment Project

An AI-powered salon calling agent that receives customer queries, responds instantly from a knowledge base, escalates to human supervisors when needed, and learns dynamically from supervisor responses.

## 📌 Overview

This project simulates an intelligent voice agent system with the following capabilities:

- **Instant Response**: Answers customer queries from a pre-existing knowledge base
- **Smart Escalation**: Routes unknown queries to human supervisors
- **Dynamic Learning**: Updates knowledge base from supervisor responses
- **Voice Interface**: Real-time voice interaction using LiveKit and Web Speech API

## 🧩 Project Structure

```
voice-agent/
│
├── backend/
│   ├── app.js
│   ├── routes/
│   │   ├── agent.js
│   │   └── supervisor.js
│   ├── controllers/
│   │   ├── agentController.js
│   │   └── supervisorController.js
│   ├── utils/
│   │   └── supabaseClient.js
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── AgentRoom.jsx
│   │   ├── SupervisorPanel.jsx
│   │   ├── components/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore
```

## ⚙️ Tech Stack

### Frontend
- **React.js** (Vite) - Fast build tool and dev server
- **LiveKit SDK** (@livekit/components-react) - Real-time voice communication
- **Web Speech API** - SpeechRecognition + SpeechSynthesis

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase JS Client** - Database client
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Database
- **Supabase** (PostgreSQL hosted) - Data persistence and management

### Voice Infrastructure
- **LiveKit Cloud** - Room simulation and voice streaming

## 🔧 Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- LiveKit account

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following variables:
```env
PORT=3000
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_KEY=your-supabase-service-key
LIVEKIT_API_KEY=your-livekit-key
LIVEKIT_API_SECRET=your-livekit-secret
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
```

4. Start the server:
```bash
npm start
```

Server runs on → `http://localhost:3000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with the following variable:
```env
VITE_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
```

4. Start the development server:
```bash
npm run dev
```

App runs on → `http://localhost:5173`

## 🗄️ Database Schema

### Table: `help_requests`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Unique identifier |
| `question` | text | User's question |
| `status` | text | pending / resolved / unresolved |
| `created_at` | timestamp | Auto-generated timestamp |
| `resolved_at` | timestamp | Nullable, set when resolved |
| `supervisor_response` | text | Supervisor's answer |
| `customer_id` | text | Simulated customer reference |

### Table: `knowledge_base`

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Primary key |
| `question` | text | Known user question |
| `answer` | text | AI response |

## 🔌 API Documentation

### Agent APIs

#### Generate LiveKit Token
```http
GET /api/agent/token
```

Generates a temporary LiveKit access token for room connection.

#### Process Customer Query
```http
POST /api/agent/query
Content-Type: application/json

{
  "message": "Where is your salon located?"
}
```

**Response (Known Query):**
```json
{
  "reply": "Our salon is located at 123 Main Street, Downtown."
}
```

**Response (Unknown Query):**
```json
{
  "reply": "Let me check with my supervisor and get back to you."
}
```

### Supervisor APIs

#### Fetch All Help Requests
```http
GET /api/supervisor/requests
```

Returns all pending, resolved, and unresolved help requests.

#### Respond to Help Request
```http
POST /api/supervisor/respond/:id
Content-Type: application/json

{
  "response": "We offer haircut services from ₹300 onwards."
}
```

**Response:**
```json
{
  "message": "Response saved and knowledge base updated."
}
```

#### Fetch Learned Answers
```http
GET /api/supervisor/learned
```

Returns all entries from the knowledge base.

## 🎯 Application Flow

1. **User Interaction**: User speaks a question in `AgentRoom.jsx`
2. **Speech Recognition**: Voice is converted to text using Web Speech API
3. **Query Processing**: Text is sent to backend `/api/agent/query`
4. **Knowledge Check**: Backend searches `knowledge_base` table
   - ✅ **Found**: Returns stored answer immediately
   - ❌ **Not Found**: Creates record in `help_requests` and replies "Let me check with my supervisor..."
5. **Supervisor Review**: Supervisor sees pending request in `SupervisorPanel.jsx`
6. **Resolution**: Supervisor provides answer via `/api/supervisor/respond/:id`
7. **Learning**: System updates knowledge base for future queries
8. **Response**: AI now knows the answer for next time!

## 🧩 Frontend Components

### AgentRoom.jsx
- Connects to LiveKit room using backend token
- Captures user voice via SpeechRecognition
- Sends transcript to `/api/agent/query`
- Speaks response using SpeechSynthesis
- Features floating 🎙️ button for voice recording

### SupervisorPanel.jsx
- Displays pending help requests from backend
- Allows supervisors to resolve or mark requests as unresolved
- Shows history of resolved requests
- Displays learned answers from knowledge base

## 🚀 Running the Application

### Terminal 1 - Backend
```bash
cd backend
npm start
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Browser Access
- **Agent Interface**: `http://localhost:5173`
- **Supervisor Panel**: `http://localhost:5173/supervisor`

## 🔮 Future Enhancements

### Scalability Improvements
- **OpenAI Realtime API**: Add streaming voice capabilities
