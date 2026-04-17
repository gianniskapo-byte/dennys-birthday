const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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
