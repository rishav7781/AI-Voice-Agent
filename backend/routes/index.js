const express = require('express');
const router = express.Router();

/* GET home page. */

router.get('/ping', (req, res) => {
  res.json({ message: 'Backend running successfully 🚀' });
});

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


module.exports = router;
