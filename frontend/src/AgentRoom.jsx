import React, { useEffect, useState } from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

export default function AgentRoom() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/agent/token");
        const data = await res.json();
        console.log("🎟️ Token response:", data);
        if (data?.token) {
          setToken(data.token);
        } else {
          console.error("❌ No token received from backend");
        }
      } catch (err) {
        console.error("Failed to fetch token:", err);
      }
    };

    fetchToken();

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log("🎤 Mic access granted manually"))
      .catch((err) => console.error("🚫 Mic permission denied:", err));
  }, []);

  if (!token) return <p>Connecting to LiveKit...</p>;

  console.log("📡 Using token:", token.slice(0, 15) + "...");

  return (
    <LiveKitRoom
      token={token}
      serverUrl={import.meta.env.VITE_LIVEKIT_URL || "wss://voice-agent-zn1rmlew.livekit.cloud"}
      connect
      video
      audio
      onConnected={() => console.log("✅ Connected to LiveKit!")}
      onDisconnected={() => console.log("❌ Disconnected from LiveKit")}
      onError={(e) => console.error("💥 LiveKit error:", e)}
      style={{ height: "100vh" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
