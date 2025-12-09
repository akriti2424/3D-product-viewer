require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const uploadRoute = require('./routes/upload');
const settingsRoute = require('./routes/settings');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api/upload', uploadRoute);
app.use('/api/settings', settingsRoute);

const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI || '';

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in .env');
  process.exit(1);
}


try {
  MONGO_URI = MONGO_URI.replace(/([?&])(?:useNewUrlParser|useUnifiedTopology|useUnifiedTopology|useUnifiedTopology)=([^&]*)/ig, '');

  
  MONGO_URI = MONGO_URI.replace(/[?&]$/g, '');

 
  MONGO_URI = MONGO_URI.replace(/\?\&/g, '?').replace(/\&\?/g, '&');

} catch (err) {
  console.warn('Error sanitizing MONGO_URI', err);
}


try {
  const safe = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  console.log('Using Mongo URI (sanitized):', safe);
} catch {
  
}

// Connect using  mongoose
mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
