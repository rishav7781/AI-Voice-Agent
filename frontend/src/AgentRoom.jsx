// import React, { useEffect, useState } from "react";
// import { LiveKitRoom, VideoConference } from "@livekit/components-react";
// import "@livekit/components-styles";

// const SpeechRecognition =
//   window.SpeechRecognition || window.webkitSpeechRecognition;
// const recognition = new SpeechRecognition();
// recognition.continuous = false;
// recognition.interimResults = false;
// recognition.lang = "en-US";

// export default function AgentRoom() {
//   const [token, setToken] = useState(null);
//   const [transcript, setTranscript] = useState("");
//   const [aiResponse, setAiResponse] = useState("");

//   useEffect(() => {
//     const fetchToken = async () => {
//       try {
//         const res = await fetch("http://localhost:3000/api/agent/token");
//         const data = await res.json();
//         setToken(data.token);
//       } catch (err) {
//         console.error("Failed to fetch token:", err);
//       }
//     };
//     fetchToken();
//   }, []);

//   const startListening = () => {
//     recognition.start();
//     recognition.onresult = (event) => {
//       const text = event.results[0][0].transcript;
//       console.log("🎙️ You said:", text);
//       setTranscript(text);
//       sendToAI(text);
//     };
//     recognition.onerror = (event) => {
//       console.error("Speech recognition error:", event.error);
//     };
//   };

//   const sendToAI = async (text) => {
//     try {
//       const res = await fetch("http://localhost:3000/api/agent/query", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: text }),
//       });
//       const data = await res.json();
//       console.log("🤖 AI:", data.reply);
//       setAiResponse(data.reply);
//       speakText(data.reply);
//     } catch (err) {
//       console.error("AI fetch error:", err);
//     }
//   };

//   const speakText = (text) => {
//     const speech = new SpeechSynthesisUtterance(text);
//     speech.lang = "en-US";
//     window.speechSynthesis.speak(speech);
//   };

//   if (!token) return <p>Connecting to LiveKit...</p>;

//   return (
//     <div>
//       <LiveKitRoom
//         token={token}
//         serverUrl={
//           import.meta.env.VITE_LIVEKIT_URL ||
//           "wss://voice-agent-zn1rmlew.livekit.cloud"
//         }
//         connect
//         video
//         audio
//         style={{ height: "60vh" }}
//       >
//         <VideoConference />
//       </LiveKitRoom>

//       {/* 🎙️ Start Talking Button (Overlay) */}
//       <button
//         onClick={startListening}
//         style={{
//           position: "absolute",
//           bottom: "40px",
//           right: "40px",
//           zIndex: 9999,
//           backgroundColor: "#007bff",
//           color: "white",
//           border: "none",
//           borderRadius: "50%",
//           width: "80px",
//           height: "80px",
//           fontSize: "14px",
//           cursor: "pointer",
//           boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
//         }}
//       >
//         🎙️
//         <br />
//         Talk
//       </button>
//     </div>
//   );
// }

import React, { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

// 🎤 Initialize Speech Recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = "en-US";

export default function AgentRoom() {
  const [token, setToken] = useState(null);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  // 🔑 Fetch LiveKit Token on Mount (non-blocking UI)
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/agent/token");
        const data = await res.json();
        setToken(data.token);
      } catch (err) {
        console.error("Failed to fetch token:", err);
      }
    };
    fetchToken();
  }, []);

  // 🎙️ Start Speech Recognition
  const startListening = () => {
    recognition.start();

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      console.log("🎙️ You said:", text);
      setTranscript(text);
      sendToAI(text);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("🎤 Recognition stopped");
    };
  };

  // 🤖 Send text to backend AI endpoint
  const sendToAI = async (text) => {
    try {
      const res = await fetch("http://localhost:3000/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      console.log("🤖 AI:", data.reply);
      setAiResponse(data.reply);
      speakText(data.reply);
    } catch (err) {
      console.error("AI fetch error:", err);
    }
  };

  // 🔊 Speak AI's Response
  const speakText = (text) => {
    // stop any previous ongoing speech
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", display: 'flex', flexDirection: 'column' }}>
      {/* Connection status banner */}
      <div style={{ padding: 10, background: token ? '#e6ffed' : '#fff4e6', color: '#333', borderBottom: '1px solid #eee' }}>
        {token ? (
          <span>Connected to LiveKit — ready</span>
        ) : (
          <span>Connecting to LiveKit... (UI is functional while connecting)</span>
        )}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, gap: 16 }}>
        {/* LiveKit area (shows placeholder if token missing) */}
  <div className="livekit-wrapper" style={{ width: '100%', maxWidth: 1100, minHeight: 300, background: '#fafafa', borderRadius: 10, overflow: 'hidden', boxShadow: '0 6px 18px rgba(0,0,0,0.06)' }}>
          {token ? (
            <LiveKitRoom
              token={token}
              serverUrl={
                import.meta.env.VITE_LIVEKIT_URL ||
                "wss://voice-agent-zn1rmlew.livekit.cloud"
              }
              connect
              video
              audio
              style={{ height: '100%', minHeight: 300 }}
            >
              <VideoConference />
            </LiveKitRoom>
          ) : (
            <div style={{ padding: 20 }}>
              <h3 style={{ margin: 0 }}>LiveKit (not connected)</h3>
              <p style={{ marginTop: 8, color: '#555' }}>Live video will appear here once a token is available. The conversation panel is available below.</p>
            </div>
          )}
        </div>

        {/* Conversation Log (always visible) */}
        <div
          style={{
            padding: 20,
            backgroundColor: '#ffffff',
            borderRadius: 10,
            margin: '0 auto',
            width: '100%',
            maxWidth: 900,
            color: '#111',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #ececec'
          }}
        >
          <h3 style={{ marginTop: 0 }}>Conversation Log</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '6px 0', color: '#333' }}>
                <strong>You:</strong>
              </p>
              <div style={{ padding: 12, background: '#fafafa', borderRadius: 6, color: '#222', minHeight: 48 }}>
                {transcript || <span style={{ color: '#888' }}>Say something...</span>}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ margin: '6px 0', color: '#333' }}>
                <strong>AI:</strong>
              </p>
              <div style={{ padding: 12, background: '#fafafa', borderRadius: 6, color: '#222', minHeight: 48 }}>
                {aiResponse || <span style={{ color: '#888' }}>Waiting for response...</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎙️ Floating Talk Button */}
      <button
        onClick={startListening}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 10000,
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: 999,
          width: 72,
          height: 72,
          fontSize: 18,
          cursor: "pointer",
          boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        aria-label="Talk"
        title="Start speaking"
      >
        🎙️
      </button>
    </div>
  );
}
