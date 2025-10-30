// routes/livekit.js
const express = require('express');
const router = express.Router();
const { AccessToken } = require('livekit-server-sdk');
require('dotenv').config();

router.get('/token', async (req, res) => {
  try {
    const { identity } = req.query;

    if (!identity) {
      return res.status(400).json({ error: 'Identity is required' });
    }

    // LiveKit credentials from .env
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const roomName = 'demo-room';

  console.log(`[livekit] generating token for identity=${identity}`);
  const at = new AccessToken(apiKey, apiSecret, { identity });
  // add grant - keep this simple; AccessToken.toJwt() is synchronous
  at.addGrant({ roomJoin: true, room: roomName });

  const token = at.toJwt();
  console.log(`[livekit] token generated for identity=${identity}`);
  res.json({ token });
  } catch (err) {
    console.error('Token generation error:', err);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
