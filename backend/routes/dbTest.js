const express = require('express');
const supabase = require('../services/supabaseService.js');
const router = express.Router();

router.get('/test', async (req, res) => {
  const { data, error } = await supabase.from('knowledge_base').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

module.exports = router;