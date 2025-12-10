// backend/src/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// routes (ensure these files exist)
const uploadRoute = require('./routes/upload');
const settingsRoute = require('./routes/settings');

const app = express();


app.use(cors({ origin: '*' })); 
app.use(express.json());


app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


app.use('/api/upload', uploadRoute);
app.use('/api/settings', settingsRoute);


app.get('/health', (req, res) => {
  res.json({ mongooseReadyState: mongoose.connection.readyState });
});

const PORT = process.env.PORT || 5000;
let MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) {
  console.error('MONGO_URI missing in .env');
  process.exit(1);
}


try {
  MONGO_URI = MONGO_URI.replace(/([?&])(?:useNewUrlParser|useUnifiedTopology|ssl)=([^&]*)/ig, '');
  MONGO_URI = MONGO_URI.replace(/[?&]$/g, '');
  MONGO_URI = MONGO_URI.replace(/\?\&/g, '?').replace(/\&\?/g, '&');
} catch (e) {
  console.warn('MONGO_URI sanitization warning', e);
}


try {
  const safe = MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
  console.log('Using Mongo URI (sanitized):', safe);
} catch { }


let serverInstance = null;
let connecting = false;

async function connectWithRetry(attempt = 1) {
  if (connecting) return;
  connecting = true;
  const maxAttempts = 12;
  const serverSelectionTimeoutMS = 5000;

  try {
    console.log(`[Mongo] Attempt ${attempt} to connect...`);
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS });
    console.log('[Mongo] Connected.');

    if (!serverInstance) {
      serverInstance = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
    }
  } catch (err) {
    console.error(`[Mongo] Attempt ${attempt} failed:`, err && err.message ? err.message : err);
    if (attempt < maxAttempts) {
      const delay = Math.min((2 ** attempt) * 1000 + Math.floor(Math.random() * 1000), 60000);
      console.log(`[Mongo] Retrying in ${Math.round(delay / 1000)}s...`);
      setTimeout(() => connectWithRetry(attempt + 1), delay);
    } else {
      console.error('[Mongo] Max attempts reached. Will keep trying periodically and keep process alive.');
      setTimeout(periodicRetry, 10000);
    }
  } finally {
    connecting = false;
  }
}

async function periodicRetry() {
  try {
    await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('[Mongo] Reconnected via periodicRetry.');
    if (!serverInstance) serverInstance = app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('[Mongo] periodicRetry failed:', err && err.message ? err.message : err);
    setTimeout(periodicRetry, 30000);
  }
}

// Connection events (debug)
mongoose.connection.on('connected', () => console.log('[Mongo Event] connected'));
mongoose.connection.on('disconnected', () => console.log('[Mongo Event] disconnected'));
mongoose.connection.on('reconnected', () => console.log('[Mongo Event] reconnected'));
mongoose.connection.on('error', err => console.error('[Mongo Event] error', err));

// graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`[Shutdown] Received ${signal}. Closing...`);
  try {
    if (serverInstance) await new Promise(res => serverInstance.close(res));
    await mongoose.disconnect();
    console.log('[Shutdown] Completed. Exiting.');
    process.exit(0);
  } catch (e) {
    console.error('[Shutdown] Error during shutdown:', e);
    process.exit(1);
  }
}
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('uncaughtException', err => console.error('uncaughtException:', err));
process.on('unhandledRejection', reason => console.error('unhandledRejection:', reason));

// start connection attempts
connectWithRetry();
