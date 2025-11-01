import React, { useState } from "react";
import AgentRoom from "./AgentRoom";
import SupervisorDashboard from "./Supervisor";

function App() {
  const [view, setView] = useState('agent');

  return (
    <div style={{ height: "100vh" }}>
      <div style={{ padding: 8, display: 'flex', gap: 8, background: '#fafafa', borderBottom: '1px solid #eee' }}>
        <button onClick={() => setView('agent')} style={{ padding: '8px 12px' }}>Agent</button>
        <button onClick={() => setView('supervisor')} style={{ padding: '8px 12px' }}>Supervisor</button>
      </div>

      <div style={{ height: 'calc(100% - 48px)' }}>
        {view === 'agent' ? <AgentRoom /> : <SupervisorDashboard />}
      </div>
    </div>
  );
}

export default App;
