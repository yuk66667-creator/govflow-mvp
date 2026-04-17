const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { matchPrograms } = require('../services/matcher');
const { sendRecommendationEmail } = require('../services/mailer');
const history = require('../services/history');

const USERS_FILE = path.join(__dirname, '../data/users.json');

function readUsers() {
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
  catch { return []; }
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// GET /api/users
router.get('/users', (req, res) => {
  const users = readUsers();
  res.json({ count: users.length, users });
});

// POST /api/users/register
router.post('/users/register', (req, res) => {
  const { email, keywords, industry, companyType, revenue, age } = req.body;

  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
  if (!Array.isArray(keywords) || keywords.length === 0)
    return res.status(400).json({ error: '키워드를 1개 이상 입력하세요.' });
  if (keywords.length > 5)
    return res.status(400).json({ error: '키워드는 최대 5개입니다.' });

  const users = readUsers();
  const existing = users.find(u => u.email === email);

  const profile = {
    email,
    keywords,
    industry:     industry     || '',
    companyType:  companyType  || '',
    revenue:      revenue      || '',
    age:          age          != null ? Number(age) : null,
    registeredAt: existing ? existing.registeredAt : new Date().toISOString()
  };

  if (existing) {
    Object.assign(existing, profile);
    writeUsers(users);
    return res.json({ message: '정보 업데이트 완료', ...profile });
  }

  users.push(profile);
  writeUsers(users);
  res.status(201).json({ message: '등록 완료', ...profile });
});

// DELETE /api/users/unregister
router.delete('/users/unregister', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
  let users = readUsers();
  const before = users.length;
  users = users.filter(u => u.email !== email);
  if (users.length === before) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
  writeUsers(users);
  res.json({ message: '삭제 완료', email });
});

// GET /api/match?email=
router.get('/match', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
  const user = readUsers().find(u => u.email === email);
  if (!user) return res.status(404).json({ error: '등록된 사용자가 아닙니다.' });
  const matched = matchPrograms(user);
  res.json({ email, keywords: user.keywords, industry: user.industry, companyType: user.companyType, matched });
});

// POST /api/send-now
router.post('/send-now', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: '이메일을 입력하세요.' });
  const user = readUsers().find(u => u.email === email);
  if (!user) return res.status(404).json({ error: '등록된 사용자가 아닙니다.' });

  const matched = matchPrograms(user);
  const result = await sendRecommendationEmail(user.email, matched);
  history.add(email, matched, result.success, result.error);
  res.json({ ...result, matched });
});

// POST /api/run-job
router.post('/run-job', async (req, res) => {
  const { runDailyJob } = require('../jobs/dailyJob');
  res.json({ message: '전체 발송 시작. 서버 로그를 확인하세요.' });
  runDailyJob();
});

module.exports = router;
