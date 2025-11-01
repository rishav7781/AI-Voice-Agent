// const express = require('express');
// const router = express.Router();
// const { AccessToken } = require('livekit-server-sdk');
// const asyncHandler = require('express-async-handler');
// const aiService = require('../services/aiService');
// const supabase = require('../services/supabaseService');

// // LiveKit connection endpoint
// router.post('/connect', asyncHandler(async (req, res) => {
//     const roomName = 'salon-reception';
//     const participantName = `customer-${Date.now()}`;
    
//     // Create access token
//     const at = new AccessToken(
//         process.env.LIVEKIT_API_KEY,
//         process.env.LIVEKIT_API_SECRET,
//         {
//             identity: participantName,
//         }
//     );
//     at.addGrant({ roomJoin: true, room: roomName });

//     res.json({ token: at.toJwt() });
// }));

// // Handle customer query
// router.post('/query', asyncHandler(async (req, res) => {
//     const { question, customerId } = req.body;
    
//     if (!question) {
//         return res.status(400).json({ error: 'Question is required' });
//     }

//     const response = await aiService.processQuery(question, customerId);
//     res.json(response);
// }));

// // Get pending help requests (for supervisor UI)
// router.get('/help-requests', asyncHandler(async (req, res) => {
//     const { data, error } = await supabase
//         .from('help_requests')
//         .select('*')
//         .order('created_at', { ascending: false });

//     if (error) throw error;
//     res.json(data);
// }));

// // Handle supervisor response
// router.post('/supervisor-response', asyncHandler(async (req, res) => {
//     const { helpRequestId, response } = req.body;

//     if (!helpRequestId || !response) {
//         return res.status(400).json({ error: 'Help request ID and response are required' });
//     }

//     // Update help request status
//     const { data: helpRequest, error: updateError } = await supabase
//         .from('help_requests')
//         .update({
//             status: 'resolved',
//             supervisor_response: response,
//             resolved_at: new Date().toISOString()
//         })
//         .eq('id', helpRequestId)
//         .select()
//         .single();

//     if (updateError) throw updateError;

//     // Update knowledge base with new information
//     await aiService.updateKnowledgeBase(helpRequest.question, response);

//     // TODO: Implement customer callback/notification here
//     // For now, we'll just log it
//     console.log(`Notifying customer ${helpRequest.customer_id} with response: ${response}`);

//     res.json({ success: true, helpRequest });
// }));

// module.exports = router;

const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const LiveKitServer = require('livekit-server-sdk');
const { AccessToken } = LiveKitServer;
const supabase = require('../services/supabaseService'); // optional, you can skip for now
const aiService = require('../services/aiService'); // your AI logic (we’ll finalize later)

// ✅ 1. Generate LiveKit Token for Voice Agent Connection
router.get('/token', asyncHandler(async (req, res) => {
    try {
        const roomName = req.query.roomName || 'salon-room';
        const identity = req.query.identity || `agent-${Date.now()}`;

        console.log("🔑 LIVEKIT_API_KEY:", process.env.LIVEKIT_API_KEY);
        console.log("🔒 LIVEKIT_API_SECRET:", process.env.LIVEKIT_API_SECRET ? "loaded ✅" : "missing ❌");

        const { AccessToken } = require('livekit-server-sdk');

        const token = new AccessToken(
            process.env.LIVEKIT_API_KEY,
            process.env.LIVEKIT_API_SECRET,
            { identity }
        );
        token.addGrant({ roomJoin: true, room: roomName });

        // ⚠️ FIX: token.toJwt() is async in latest versions
        const jwt = await token.toJwt();

        console.log("🎟️ Token generated (type):", typeof jwt);
        console.log("🎟️ Token preview:", jwt.substring(0, 20) + "...");

        res.json({
            success: true,
            room: roomName,
            identity,
            token: jwt, // ✅ now it's a real JWT string
        });

    } catch (err) {
        console.error('Error generating token:', err);
        res.status(500).json({ error: 'Failed to generate LiveKit token' });
    }
}));




// ✅ 2. Process Customer Query (for demo: fake AI answers)
// router.post('/query', asyncHandler(async (req, res) => {
//     const { question, customerId } = req.body;

//     if (!question) {
//         return res.status(400).json({ error: 'Question is required' });
//     }

//     // Basic salon knowledge base (hardcoded)
//     const knowledge = {
//         "what are your hours": "We’re open Monday to Saturday, 9 AM to 7 PM.",
//         "where are you located": "We’re at 123 Beauty Lane, Cityville.",
//         "do you offer manicure": "Yes, we offer manicure and pedicure services.",
//     };

//     const normalized = question.trim().toLowerCase();
//     if (knowledge[normalized]) {
//         return res.json({
//             known: true,
//             answer: knowledge[normalized]
//         });
//     } else {
//         // Unknown question → create help request
//         console.log(`🤖 AI: Escalating to supervisor → "${question}"`);
//         return res.json({
//             known: false,
//             message: "Let me check with my supervisor and get back to you."
//         });
//     }
// }));

// router.post('/query', asyncHandler(async (req, res) => {
//     const { question, customerId } = req.body;

//     if (!question) return res.status(400).json({ error: 'Question is required' });

//     const response = await aiService.processQuery(question, customerId);
//     res.json(response);
// }));

// router.post("/query", async (req, res) => {
//   const { query } = req.body;

//   if (!query) return res.status(400).json({ success: false, message: "Missing query" });

//   console.log("🤖 User asked:", query);

//   // Simulate a simple local AI logic
//   let response;
//   if (query.toLowerCase().includes("refund")) {
//     response = "Our refund policy allows refunds within 7 days of purchase.";
//   } else if (query.toLowerCase().includes("hello")) {
//     response = "Hi there! How can I assist you today?";
//   } else {
//     response = "I'm your AI assistant — still learning more responses each day!";
//   }

//   // Simulate escalation detection
//   if (query.toLowerCase().includes("supervisor")) {
//     console.log("🤖 Escalating to supervisor →", query);
//   }

//   res.json({ success: true, response });
// });

router.post("/query", async (req, res) => {
  const { message } = req.body;

  // Basic mock intelligence
  let reply = "I’m not sure I understand.";
  if (message.toLowerCase().includes("hello")) reply = "Hi there! How can I help you today?";
  else if (message.toLowerCase().includes("refund"))
    reply = "Our refund policy allows returns within 30 days.";
  else if (message.toLowerCase().includes("time"))
    reply = `It's currently ${new Date().toLocaleTimeString()}.`;

  res.json({ reply });
});


// ✅ 3. Simple Health Check
router.get('/', (req, res) => {
    res.send('Agent route is live 🚀');
});

module.exports = router;
