import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
    const [helpRequests, setHelpRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [response, setResponse] = useState('');

    useEffect(() => {
        fetchHelpRequests();
        // Poll for new requests every 30 seconds
        const interval = setInterval(fetchHelpRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchHelpRequests = async () => {
        try {
            const response = await axios.get('/api/agent/help-requests');
            setHelpRequests(response.data);
        } catch (error) {
            console.error('Error fetching help requests:', error);
        }
    };

    const handleSubmitResponse = async () => {
        if (!selectedRequest || !response) return;

        try {
            await axios.post('/api/agent/supervisor-response', {
                helpRequestId: selectedRequest.id,
                response: response
            });
            
            setResponse('');
            setSelectedRequest(null);
            fetchHelpRequests();
        } catch (error) {
            console.error('Error submitting response:', error);
        }
    };

    return (
        <div className="supervisor-dashboard">
            <div className="requests-list">
                <h2>Pending Help Requests</h2>
                {helpRequests
                    .filter(request => request.status === 'pending')
                    .map(request => (
                        <div 
                            key={request.id}
                            className={`request-item ${selectedRequest?.id === request.id ? 'selected' : ''}`}
                            onClick={() => setSelectedRequest(request)}
                        >
                            <div className="request-header">
                                <span className="customer-id">Customer: {request.customer_id}</span>
                                <span className="timestamp">
                                    {new Date(request.created_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="question">{request.question}</div>
                        </div>
                    ))}
            </div>

            <div className="response-section">
                <h2>Respond to Request</h2>
                {selectedRequest ? (
                    <>
                        <div className="selected-question">
                            <strong>Question:</strong> {selectedRequest.question}
                        </div>
                        <textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Type your response here..."
                        />
                        <button 
                            onClick={handleSubmitResponse}
                            disabled={!response}
                        >
                            Submit Response
                        </button>
                    </>
                ) : (
                    <p>Select a help request to respond</p>
                )}
            </div>

            <div className="resolved-requests">
                <h2>Resolved Requests</h2>
                {helpRequests
                    .filter(request => request.status === 'resolved')
                    .map(request => (
                        <div key={request.id} className="resolved-item">
                            <div className="request-header">
                                <span className="customer-id">Customer: {request.customer_id}</span>
                                <span className="timestamp">
                                    {new Date(request.resolved_at).toLocaleString()}
                                </span>
                            </div>
                            <div className="question">{request.question}</div>
                            <div className="response">{request.supervisor_response}</div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default SupervisorDashboard;