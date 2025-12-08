const express = require('express');
const Setting = require('../models/Setting');
const router = express.Router();

router.post('/', async (req,res) => {
  const { backgroundColor, wireframe, modelUrl } = req.body;
  const s = new Setting({ backgroundColor, wireframe, modelUrl });
  await s.save();
  res.json(s);
});

router.get('/', async (req,res) => {
  const latest = await Setting.findOne().sort({createdAt:-1});
  res.json(latest);
});

module.exports = router;
