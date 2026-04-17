const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const PROGRAMS_FILE = path.join(__dirname, '../data/programs.json');

function readPrograms() {
  try { return JSON.parse(fs.readFileSync(PROGRAMS_FILE, 'utf-8')); }
  catch { return require('../mock/programs'); }
}

// GET /api/programs
router.get('/programs', (req, res) => {
  const programs = readPrograms();
  res.json({ count: programs.length, programs });
});

// GET /api/programs/search?q=
router.get('/programs/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const programs = readPrograms();
  if (!q) return res.json({ count: programs.length, programs });

  const filtered = programs.filter(p =>
    p.title.toLowerCase().includes(q) ||
    (p.keywords || []).some(k => k.toLowerCase().includes(q)) ||
    (p.ministry || '').toLowerCase().includes(q) ||
    (p.category || '').toLowerCase().includes(q) ||
    (p.eligibility || '').toLowerCase().includes(q)
  );
  res.json({ count: filtered.length, programs: filtered });
});
module.exports = router;
