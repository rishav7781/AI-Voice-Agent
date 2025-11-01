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

// router.post("/query", async (req, res) => {
//   const { message, customerId } = req.body;

//   if (!message) return res.status(400).json({ error: "Missing message" });

//   try {
//     // 🧩 1. Normalize message (lowercase + synonyms)
//     const synonyms = {
//       hours: ["timing", "time", "open", "opening", "closing"],
//       appointment: ["book", "reservation", "schedule"],
//       location: ["address", "place", "where", "situated"],
//       price: ["cost", "rate", "charge", "fee"],
//       service: ["treatment", "offer", "package"],
//       cancel: ["reschedule", "change", "modify"],
//       discount: ["offer", "deal", "promotion"],
//       product: ["brand", "item", "material"],
//     };

//     function normalizeSynonyms(text) {
//       let result = text.toLowerCase();
//       for (const key in synonyms) {
//         for (const alt of synonyms[key]) {
//           const regex = new RegExp(`\\b${alt}\\b`, "gi");
//           result = result.replace(regex, key); // replace "timing" → "hours"
//         }
//       }
//       return result.trim();
//     }

//     const normalized = normalizeSynonyms(message);

//     // 🧮 2. Helper function for fuzzy comparison (Levenshtein distance)
//     function levenshtein(a, b) {
//       if (!a || !b) return (a || b) ? Math.max(a.length, b.length) : 0;
//       const matrix = [];
//       for (let i = 0; i <= b.length; i++) matrix[i] = [i];
//       for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
//       for (let i = 1; i <= b.length; i++) {
//         for (let j = 1; j <= a.length; j++) {
//           matrix[i][j] =
//             b.charAt(i - 1) === a.charAt(j - 1)
//               ? matrix[i - 1][j - 1]
//               : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
//         }
//       }
//       return matrix[b.length][a.length];
//     }

//     // 🧠 3. Exact match lookup from Supabase knowledge base
//     const { data: kbExact, error: kbError } = await supabase
//       .from("knowledge_base")
//       .select("answer")
//       .eq("question", normalized)
//       .maybeSingle();

//     if (kbError) console.error("Supabase KB error:", kbError);

//     if (kbExact && kbExact.answer) {
//       console.log(`✅ Exact match found for "${normalized}"`);
//       return res.json({ reply: kbExact.answer, known: true, fuzzy: false });
//     }

//     // 🔍 4. Fuzzy match lookup
//     const { data: allKb, error: allErr } = await supabase
//       .from("knowledge_base")
//       .select("question, answer");

//     if (allErr) console.error("Failed to fetch KB rows for fuzzy matching:", allErr);

//     let best = { dist: Infinity, answer: null, question: null };

//     if (Array.isArray(allKb) && allKb.length > 0) {
//       for (const row of allKb) {
//         const q = (row.question || "").trim().toLowerCase();
//         const dist = levenshtein(normalized, q);
//         if (dist < best.dist) best = { dist, answer: row.answer, question: q };
//       }

//       // tolerance = allow up to 20% edit difference
//       const tolerance = Math.max(1, Math.floor(normalized.length * 0.2));
//       if (best.answer && best.dist <= tolerance) {
//         console.log(
//           `🔎 Fuzzy matched "${normalized}" -> "${best.question}" (dist=${best.dist})`
//         );
//         return res.json({ reply: best.answer, known: true, fuzzy: true });
//       }
//     }

//     // 🆘 5. Not known → create a help request in Supabase
//     const helpPayload = {
//       question: message,
//       status: "pending",
//       customer_id: customerId || null,
//     };

//     const { data: helpData, error: insertErr } = await supabase
//       .from("help_requests")
//       .insert([helpPayload])
//       .select()
//       .maybeSingle();

//     if (insertErr) {
//       console.error("❌ Failed to create help_request:", insertErr);
//     } else if (helpData) {
//       console.log(
//         `📩 Help request created id=${helpData.id} question="${message}"`
//       );
//     }

//     // 🤝 Return polite escalation message
//     return res.json({
//       reply: "Let me check with my supervisor and get back to you.",
//       known: false,
//     });
//   } catch (err) {
//     console.error("Agent /query error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

// router.post("/query", async (req, res) => {
//   const { message, customerId } = req.body;

//   if (!message) return res.status(400).json({ error: "Missing message" });

//   try {
//     const cleanText = message
//       .toLowerCase()
//       .replace(/[^\w\s]/g, "") // remove punctuation
//       .trim();

//     // 🧩 Expand synonyms
//     const synonyms = {
//       hours: ["timing", "time", "open", "opening", "closing"],
//       appointment: ["book", "reservation", "schedule"],
//       location: ["address", "place", "where", "situated", "where's"],
//       price: ["cost", "rate", "charge", "fee"],
//       service: ["treatment", "offer", "package"],
//       cancel: ["reschedule", "change", "modify"],
//       discount: ["offer", "deal", "promotion"],
//       product: ["brand", "item", "material"],
//     };

//     let normalized = cleanText;
//     for (const key in synonyms) {
//       for (const alt of synonyms[key]) {
//         const regex = new RegExp(`\\b${alt}\\b`, "gi");
//         normalized = normalized.replace(regex, key);
//       }
//     }

//     // 🧠 Fetch all questions from Supabase
//     const { data: kbRows, error } = await supabase
//       .from("knowledge_base")
//       .select("question, answer");

//     if (error) {
//       console.error("Supabase KB fetch error:", error);
//       return res.status(500).json({ error: "Database fetch error" });
//     }

//     // Normalize DB questions too
//     const cleanDB = (str) =>
//       (str || "").toLowerCase().replace(/[^\w\s]/g, "").trim();

//     // 🧩 Try direct and partial matches
//     let bestAnswer = null;
//     for (const row of kbRows) {
//       const dbQ = cleanDB(row.question);
//       if (normalized.includes(dbQ) || dbQ.includes(normalized)) {
//         bestAnswer = row.answer;
//         break;
//       }
//     }

//     if (bestAnswer) {
//       console.log(`✅ Matched query → "${normalized}"`);
//       return res.json({ reply: bestAnswer, known: true });
//     }

//     // 🆘 No match → escalate
//     await supabase.from("help_requests").insert([
//       {
//         question: message,
//         status: "pending",
//         customer_id: customerId || null,
//       },
//     ]);

//     return res.json({
//       reply: "Let me check with my supervisor and get back to you.",
//       known: false,
//     });
//   } catch (err) {
//     console.error("Agent /query error:", err);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

router.post("/query", async (req, res) => {
  const { message, customerId } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

  try {
    const cleanText = message.toLowerCase().replace(/[^\w\s]/g, "").trim();

    // 🧩 Expand synonyms
    const synonyms = {
      hours: ["timing", "time", "open", "opening", "closing"],
      appointment: ["book", "reservation", "schedule"],
      location: ["address", "place", "where", "situated", "where's"],
      price: ["cost", "rate", "charge", "fee"],
      service: ["treatment", "offer", "package"],
      cancel: ["reschedule", "change", "modify"],
      discount: ["offer", "deal", "promotion"],
      product: ["brand", "item", "material"],
    };

    let normalized = cleanText;
    for (const key in synonyms) {
      for (const alt of synonyms[key]) {
        const regex = new RegExp(`\\b${alt}\\b`, "gi");
        normalized = normalized.replace(regex, key);
      }
    }

    // 🧠 Fetch KB
    const { data: kbRows, error } = await supabase
      .from("knowledge_base")
      .select("question, answer");

    if (error) {
      console.error("Supabase KB fetch error:", error);
      return res.status(500).json({ error: "Database fetch error" });
    }

    // 🧮 Helper: word similarity
    function wordOverlapScore(a, b) {
      const aWords = new Set(a.split(" "));
      const bWords = new Set(b.split(" "));
      let common = 0;
      for (const word of aWords) if (bWords.has(word)) common++;
      return common / Math.max(aWords.size, bWords.size);
    }

    // 🧩 Find best match
    let best = { score: 0, answer: null, question: null };

    for (const row of kbRows) {
      const dbQ = (row.question || "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
      const score = wordOverlapScore(normalized, dbQ);
      if (score > best.score) best = { score, answer: row.answer, question: dbQ };
    }

    console.log(
      `🔎 "${normalized}" best match → "${best.question}" (score=${best.score.toFixed(
        2
      )})`
    );

    // 🧠 Accept if >= 0.4 similarity (tune threshold)
    if (best.score >= 0.4 && best.answer) {
      console.log("✅ Responding with known answer");
      return res.json({ reply: best.answer, known: true });
    }

    // 🆘 Otherwise escalate
    await supabase.from("help_requests").insert([
      { question: message, status: "pending", customer_id: customerId || null },
    ]);

    console.log(`🆘 Escalated → "${message}"`);
    return res.json({
      reply: "Let me check with my supervisor and get back to you.",
      known: false,
    });
  } catch (err) {
    console.error("Agent /query error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});





// ✅ 3. Simple Health Check
router.get('/', (req, res) => {
    res.send('Agent route is live 🚀');
});

module.exports = router;
