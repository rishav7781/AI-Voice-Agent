const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const supabase = require('../services/supabaseService');

// GET /requests - list pending help requests (most recent first)
router.get('/requests', asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('help_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch help requests:', error);
    return res.status(500).json({ error: 'Failed to fetch help requests' });
  }

  res.json(data);
}));

// POST /resolve/:id - supervisor resolves a help request and teaches the KB
router.post('/resolve/:id', asyncHandler(async (req, res) => {
  const id = req.params.id;
  const { answer } = req.body;

  if (!answer) return res.status(400).json({ error: 'Answer is required' });

  // Update the help_requests entry
  const { data: updated, error: updateErr } = await supabase
    .from('help_requests')
    .update({
      status: 'resolved',
      supervisor_response: answer,
      resolved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) {
    console.error('Failed to update help_request:', updateErr);
    return res.status(500).json({ error: 'Failed to update help request' });
  }

  // Teach the knowledge base (store normalized question)
  const normalized = (updated.question || '').trim().toLowerCase();
  try {
    // upsert so duplicates don't cause failures. use maybeSingle to be lenient.
    const { data: kbRow, error: kbErr } = await supabase
      .from('knowledge_base')
      .upsert({ question: normalized, answer, created_at: new Date().toISOString() }, { onConflict: 'question' })
      .select()
      .maybeSingle();

    if (kbErr) {
      console.error('Failed to upsert knowledge_base:', kbErr);
    } else {
      console.log(`🧠 Learned new info: "${normalized}" -> "${answer}"`);
    }
  } catch (err) {
    console.warn('Error teaching KB:', err.message || err);
  }

  res.json(updated);
}));

module.exports = router;
