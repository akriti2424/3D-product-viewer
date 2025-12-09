const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  backgroundColor: { type: String, default: '#ffffff' },
  wireframe: { type: Boolean, default: false },
  modelUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', SettingSchema);
