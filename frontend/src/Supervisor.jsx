import React, { useEffect, useState } from 'react';

export default function SupervisorDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/supervisor/requests');
      const data = await res.json();
      setRequests(data || []);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveRequest = async (id, answer) => {
    if (!answer || !id) return;
    try {
      await fetch(`http://localhost:3000/api/supervisor/resolve/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      // clear local input and refresh
      setAnswers((s) => {
        const copy = { ...s };
        delete copy[id];
        return copy;
      });
      fetchRequests();
    } catch (err) {
      console.error('Failed to resolve request', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // poll every 8 seconds to keep dashboard fresh
    const iv = setInterval(fetchRequests, 8000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ padding: 18, display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 1000 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Supervisor Dashboard</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={fetchRequests}
              disabled={loading}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#007bff', color: '#fff', cursor: 'pointer' }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {requests.length === 0 && (
          <div style={{ padding: 20, background: '#fff', borderRadius: 10, boxShadow: '0 6px 16px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
            <p style={{ margin: 0, color: '#555' }}>No requests yet.</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
          {requests.map((req) => (
            <div key={req.id} style={{ padding: 14, background: '#fff', borderRadius: 10, boxShadow: '0 6px 18px rgba(0,0,0,0.04)', border: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, color: '#222' }}><strong>Q:</strong> <span style={{ color: '#444' }}>{req.question}</span></div>
                <div>
                  <span style={{ padding: '6px 10px', borderRadius: 20, background: req.status === 'pending' ? '#fff5e6' : '#e6fff0', color: '#333', fontSize: 12, border: '1px solid #efe9dc' }}>{req.status}</span>
                </div>
              </div>

              {req.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Type an answer..."
                    value={answers[req.id] || ''}
                    onChange={(e) => setAnswers((s) => ({ ...s, [req.id]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const v = (answers[req.id] || '').trim();
                        if (v) resolveRequest(req.id, v);
                      }
                    }}
                    style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #ddd' }}
                  />

                  <button
                    onClick={() => {
                      const v = (answers[req.id] || '').trim();
                      if (v) resolveRequest(req.id, v);
                    }}
                    disabled={!answers[req.id] || answers[req.id].trim() === ''}
                    style={{ padding: '10px 14px', borderRadius: 8, border: 'none', background: '#28a745', color: '#fff', cursor: 'pointer' }}
                  >
                    Resolve
                  </button>
                </div>
              )}

              {req.status === 'resolved' && (
                <div style={{ padding: 10, background: '#f8fdf9', borderRadius: 8, border: '1px solid #e6f3ea' }}>
                  <strong>Answer:</strong>
                  <div style={{ marginTop: 6, color: '#222' }}>{req.supervisor_response}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
