
# 🎙️ AI Voice Agent — Salon Receptionist (local dev)

This repository is a small voice-agent simulation that receives spoken customer queries in the browser, answers from a knowledge base (Supabase) when possible, escalates unknown questions to a human supervisor, and learns from supervisor responses so the system improves over time.

The project is split into two parts:
- `backend/` — Express server providing LiveKit token generation, AI/agent APIs, and Supabase integration.
- `frontend/` — Vite + React UI with an Agent view (voice + LiveKit) and a Supervisor dashboard.

This README documents the actual files, endpoints, and how to run the app locally.

---

## Repo layout (important files)

```
Voice Agent/
├─ backend/
│  ├─ app.js
│  ├─ package.json
│  ├─ bin/www
│  ├─ routes/
│  │  ├─ agent.js
│  │  ├─ livekit.js
│  │  ├─ supervisor.js
│  │  └─ index.js
│  ├─ services/
│  │  ├─ aiService.js
│  │  └─ supabaseService.js
│  └─ views/
│     ├─ index.jade
│     └─ error.jade

├─ frontend/
│  ├─ package.json
│  ├─ vite.config.js
│  └─ src/
│     ├─ main.jsx
│     ├─ App.jsx
│     ├─ AgentRoom.jsx
│     ├─ Supervisor.jsx
│     ├─ index.css
│     └─ App.css

└─ .gitignore
```

---

## Quick summary of how it works

- The browser Agent UI captures speech (Web Speech API) and sends the transcribed message to the backend `POST /api/agent/query`.
- The backend normalizes the message and first checks the `knowledge_base` table in Supabase for an exact or fuzzy match.
  - If a match is found: the backend returns the stored answer and the frontend uses SpeechSynthesis to speak it.
  - If not found: the backend inserts a row into `help_requests` (status `pending`) and replies: "Let me check with my supervisor and get back to you." The supervisor will review and answer.
- The Supervisor UI (in the frontend App toggle) lists requests from `GET /api/supervisor/requests`. When the supervisor resolves a request, the backend updates the request and upserts the Q→A into `knowledge_base` so future identical/close questions are answered automatically.
- A LiveKit token endpoint (`GET /api/agent/token`) provides a JWT to the frontend LiveKit client so it can join the room for voice/video simulation.

---

## Database (Supabase) schema (used by the backend)

Table: `help_requests`
- `id` (uuid) — primary key
- `question` (text) — the customer's question
- `status` (text) — `pending` / `resolved` / `unresolved`
- `created_at` (timestamp) — default now()
- `resolved_at` (timestamp) — nullable
- `supervisor_response` (text) — nullable
- `customer_id` (text) — optional reference to caller

Table: `knowledge_base`
- `id` (uuid) — primary key
- `question` (text) — normalized question (unique)
- `answer` (text) — stored answer
- `created_at` (timestamp) — default now()

Notes:
- The backend normalizes user messages to lowercase and trims them when doing exact lookups. It also performs a simple fuzzy-match (Levenshtein) against `knowledge_base` so small typos or misspellings will still match.

---

## Environment variables

Backend `.env` (required):
```
PORT=3000
SUPABASE_URL=https://<your-supabase>.supabase.co
SUPABASE_KEY=<your-supabase-service-key>
LIVEKIT_API_KEY=<livekit-api-key>           # optional for token generation
LIVEKIT_API_SECRET=<livekit-api-secret>     # optional for token generation
```

Frontend `.env` (optional):
```
VITE_LIVEKIT_URL=wss://<your-livekit-instance>.livekit.cloud
```

Important: keep your Supabase service key secret (only set it on the backend). Do not commit `.env` to source control.

---

## API endpoints (actual routes)

Agent routes (mounted under `/api/agent`):
- GET `/api/agent/token` — generate LiveKit token (accepts optional `identity` and `roomName` query params)
- POST `/api/agent/query` — body: `{ message: string, customerId?: string }`
  - Response (known): `{ reply: string, known: true }`
  - Response (escalated): `{ reply: 'Let me check with my supervisor and get back to you.', known: false }`

Supervisor routes (mounted under `/api/supervisor`):
- GET `/api/supervisor/requests` — return help requests (most recent first)
- POST `/api/supervisor/resolve/:id` — body: `{ answer: string }`
  - Updates the `help_requests` row and upserts the normalized question → answer into `knowledge_base`.

Other:
- GET `/api` and routes in `routes/index.js` provide basic pings.

---

## How to run locally (dev)

Prerequisites:
- Node.js 16+ and npm
- A Supabase project with the two tables described above

1) Backend

```powershell
cd backend
npm install
# create a .env with SUPABASE_URL and SUPABASE_KEY (and LiveKit keys if needed)
npm start
```
Server will listen on `http://localhost:3000` by default.

2) Frontend

```powershell
cd frontend
npm install
# optional: create .env with VITE_LIVEKIT_URL
npm run dev
```
Frontend dev server (Vite) will be at `http://localhost:5173`.

Open the frontend in your browser. The app contains two main views (use the top-left toggle):
- Agent (voice + LiveKit)
- Supervisor (review pending requests and resolve)

---

## Quick test flow (manual)

1. Ask a question via the Agent UI or send a POST directly:

```powershell
curl -X POST http://localhost:3000/api/agent/query -H "Content-Type: application/json" -d '{"message":"what are your salon hours"}'
```

2. If not in KB, the response will be the escalation message and a new `help_requests` row will be added.
3. Open the frontend Supervisor view (or call the API) to list pending requests:

```powershell
curl http://localhost:3000/api/supervisor/requests
```

4. Resolve one request (replace `<id>`):

```powershell
curl -X POST http://localhost:3000/api/supervisor/resolve/<id> -H "Content-Type: application/json" -d '{"answer":"We are open from 9 AM to 8 PM every day."}'
```

5. Ask the same question again — the agent should now return the learned answer from `knowledge_base`.

---

## Notes, gotchas & recommended small improvements

- Theme/CSS: The project uses a default light theme now; if you see white-on-white text inside LiveKit components, the frontend `index.css` contains ` .livekit-wrapper` overrides to force readable contrast.
- Speech APIs: Browser `SpeechRecognition` and `SpeechSynthesis` are used — not all browsers support them equally. Use Chrome for the best dev experience.
- Security: Keep Supabase keys secret. Using the Supabase service key should only be done server-side.
- Matching: Current fuzzy matching is basic (Levenshtein). For paraphrase matching you can upgrade to embedding-based similarity (Supabase Vector or external vector DB) later.

---

## Where to look in the code

- `frontend/src/AgentRoom.jsx` — live UI, speech capture, token fetch, sending queries, speaking replies.
- `frontend/src/Supervisor.jsx` — supervisor dashboard (list requests, resolve them).
- `backend/routes/agent.js` — query handling, KB lookup (exact + fuzzy) and help request insertion.
- `backend/routes/supervisor.js` — endpoints to fetch requests and resolve + teach KB.
- `backend/services/supabaseService.js` — Supabase client initialized from env.
- `backend/services/aiService.js` — small helper that can call an external AI model (currently uses free HF endpoint if configured).

---

If you'd like, I can:
- Seed the `knowledge_base` with a few salon FAQs so you can test immediately.
- Wire `aiService` into the `/api/agent/query` flow as a second-level fallback (KB → AI model → escalate).
- Add a small theme toggle in the frontend UI.

Which of these would you like next?

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
