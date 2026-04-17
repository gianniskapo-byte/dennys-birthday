const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'rsvp.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function ensureDataFile() {
  const dir = path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readRSVPs() {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeRSVPs(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ── Google Sheets via Apps Script Web App ───────────────
const SHEET_URL = process.env.GOOGLE_SCRIPT_URL || '';

function postToSheet(payload) {
  if (!SHEET_URL) return;   // not configured yet — skip silently
  try {
    const body = JSON.stringify(payload);
    const url  = new URL(SHEET_URL);
    const lib  = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = lib.request(opts, res => {
      res.on('data', () => {});
      res.on('end', () => console.log(`📊 Sheet updated (HTTP ${res.statusCode})`));
    });
    req.on('error', e => console.warn('⚠️  Sheet sync failed:', e.message));
    req.write(body);
    req.end();
  } catch (e) {
    console.warn('⚠️  Sheet sync error:', e.message);
  }
}

// POST /api/rsvp
app.post('/api/rsvp', (req, res) => {
  const { surname, guests, message } = req.body;

  if (!surname || typeof surname !== 'string' || surname.trim().length < 2) {
    return res.status(400).json({ error: 'Παρακαλώ δώστε το επώνυμό σας (τουλάχιστον 2 χαρακτήρες).' });
  }

  const guestsNum = parseInt(guests);
  if (isNaN(guestsNum) || guestsNum < 1 || guestsNum > 20) {
    return res.status(400).json({ error: 'Ο αριθμός ατόμων πρέπει να είναι μεταξύ 1 και 20.' });
  }

  const rsvps = readRSVPs();

  const exists = rsvps.find(
    r => r.surname.toLowerCase() === surname.trim().toLowerCase()
  );
  if (exists) {
    return res.status(409).json({ error: 'Έχετε ήδη δηλώσει συμμετοχή! Σας περιμένουμε! 🐾' });
  }

  const entry = {
    id: Date.now(),
    surname: surname.trim(),
    guests: guestsNum,
    message: message ? message.trim().substring(0, 200) : '',
    submittedAt: new Date().toISOString()
  };

  rsvps.push(entry);
  writeRSVPs(rsvps);

  console.log(`New RSVP: ${entry.surname} — ${entry.guests} guests`);
  postToSheet(entry);   // fire-and-forget to Google Sheet
  res.status(201).json({ success: true, entry });
});

// GET /api/rsvp (admin)
app.get('/api/rsvp', (req, res) => {
  const token = req.query.token;
  const adminToken = process.env.ADMIN_TOKEN || 'pawpatrol2025';
  if (token !== adminToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const rsvps = readRSVPs();
  const totalGuests = rsvps.reduce((sum, r) => sum + r.guests, 0);
  res.json({ count: rsvps.length, totalGuests, rsvps });
});

// Bulk-sync all existing RSVPs to Google Sheet (admin only)
app.post('/api/sync-to-sheet', (req, res) => {
  const token = req.query.token || req.body.token;
  const adminToken = process.env.ADMIN_TOKEN || 'pawpatrol2025';
  if (token !== adminToken) return res.status(401).json({ error: 'Unauthorized' });
  if (!SHEET_URL) return res.status(400).json({ error: 'GOOGLE_SCRIPT_URL not configured' });

  const rsvps = readRSVPs();
  postToSheet({ action: 'bulk', entries: rsvps });
  res.json({ ok: true, syncing: rsvps.length });
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

ensureDataFile();
app.listen(PORT, () => {
  console.log(`\n🐾 Paw Patrol Party Server running at http://localhost:${PORT}\n`);
});
