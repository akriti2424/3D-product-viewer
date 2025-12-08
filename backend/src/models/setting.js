const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema({
  backgroundColor: String,
  wireframe: Boolean,
  modelUrl: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Setting', SettingSchema);
