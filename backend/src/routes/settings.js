const express = require('express');
const Setting = require('../models/Setting');
const router = express.Router();

// Save settings
router.post('/', async (req, res) => {
  try {
    const { backgroundColor, wireframe, modelUrl } = req.body;
    const s = new Setting({ backgroundColor, wireframe, modelUrl });
    const saved = await s.save();
    res.json(saved);
  } catch (err) {
    console.error('Save settings error', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Get latest setting (most recent)
router.get('/', async (req, res) => {
  try {
    const latest = await Setting.findOne().sort({ createdAt: -1 });
    res.json(latest);
  } catch (err) {
    console.error('Fetch settings error', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

module.exports = router;
