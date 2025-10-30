const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
const asyncHandler = require('express-async-handler');
const aiService = require('../services/aiService');
const supabase = require('../services/supabaseService');

// LiveKit connection endpoint
router.post('/connect', asyncHandler(async (req, res) => {
    const roomName = 'salon-reception';
    const participantName = `customer-${Date.now()}`;
    
    // Create access token
    const at = new AccessToken(
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
        {
            identity: participantName,
        }
    );
    at.addGrant({ roomJoin: true, room: roomName });

    res.json({ token: at.toJwt() });
}));

// Handle customer query
router.post('/query', asyncHandler(async (req, res) => {
    const { question, customerId } = req.body;
    
    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const response = await aiService.processQuery(question, customerId);
    res.json(response);
}));

// Get pending help requests (for supervisor UI)
router.get('/help-requests', asyncHandler(async (req, res) => {
    const { data, error } = await supabase
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
}));

// Handle supervisor response
router.post('/supervisor-response', asyncHandler(async (req, res) => {
    const { helpRequestId, response } = req.body;

    if (!helpRequestId || !response) {
        return res.status(400).json({ error: 'Help request ID and response are required' });
    }

    // Update help request status
    const { data: helpRequest, error: updateError } = await supabase
        .from('help_requests')
        .update({
            status: 'resolved',
            supervisor_response: response,
            resolved_at: new Date().toISOString()
        })
        .eq('id', helpRequestId)
        .select()
        .single();

    if (updateError) throw updateError;

    // Update knowledge base with new information
    await aiService.updateKnowledgeBase(helpRequest.question, response);

    // TODO: Implement customer callback/notification here
    // For now, we'll just log it
    console.log(`Notifying customer ${helpRequest.customer_id} with response: ${response}`);

    res.json({ success: true, helpRequest });
}));

module.exports = router;
