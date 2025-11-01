import React, { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

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
  };

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

  const speakText = (text) => {
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = "en-US";
    window.speechSynthesis.speak(speech);
  };

  if (!token) return <p>Connecting to LiveKit...</p>;

  return (
    <div>
      <LiveKitRoom
        token={token}
        serverUrl={
          import.meta.env.VITE_LIVEKIT_URL ||
          "wss://voice-agent-zn1rmlew.livekit.cloud"
        }
        connect
        video
        audio
        style={{ height: "60vh" }}
      >
        <VideoConference />
      </LiveKitRoom>

      {/* 🎙️ Start Talking Button (Overlay) */}
      <button
        onClick={startListening}
        style={{
          position: "absolute",
          bottom: "40px",
          right: "40px",
          zIndex: 9999,
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "80px",
          height: "80px",
          fontSize: "14px",
          cursor: "pointer",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
        }}
      >
        🎙️
        <br />
        Talk
      </button>
    </div>
  );
}
