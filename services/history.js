const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.join(__dirname, '../data/history.json');

function read() {
  try { return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8')); }
  catch { return []; }
}

function add(email, matched, success, error) {
  const history = read();
  history.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    email,
    sentAt: new Date().toISOString(),
    matchCount: matched.length,
    matched: matched.map(m => ({ title: m.title, score: m.score || 0 })),
    success,
    error: error || null
  });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

module.exports = { read, add };
