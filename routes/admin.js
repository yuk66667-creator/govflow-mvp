const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const history = require('../services/history');

const PROGRAMS_FILE = path.join(__dirname, '../data/programs.json');

function readPrograms() {
  try { return JSON.parse(fs.readFileSync(PROGRAMS_FILE, 'utf-8')); }
  catch { return []; }
}
function writePrograms(programs) {
  fs.writeFileSync(PROGRAMS_FILE, JSON.stringify(programs, null, 2));
}
function nextId(programs) {
  return programs.length > 0 ? Math.max(...programs.map(p => p.id || 0)) + 1 : 1;
}

// ── 공고 추가
router.post('/admin/programs', (req, res) => {
  const programs = readPrograms();
  const program = {
    id: nextId(programs),
    title:        req.body.title        || '',
    amount:       req.body.amount       || '-',
    deadline:     req.body.deadline     || '',
    keywords:     toArray(req.body.keywords),
    ministry:     req.body.ministry     || '',
    category:     req.body.category     || '',
    eligibility:  req.body.eligibility  || '',
    description:  req.body.description  || '',
    industries:   toArray(req.body.industries,  ['전체']),
    companyTypes: toArray(req.body.companyTypes, ['전체']),
    minAge:       toNum(req.body.minAge),
    maxAge:       toNum(req.body.maxAge),
    link:         req.body.link         || '',
    region:       req.body.region       || '전국'
  };
  if (!program.title) return res.status(400).json({ error: '공고명은 필수입니다.' });
  programs.push(program);
  writePrograms(programs);
  res.status(201).json({ success: true, program });
});

// ── 공고 수정
router.put('/admin/programs/:id', (req, res) => {
  const programs = readPrograms();
  const idx = programs.findIndex(p => p.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ error: '공고를 찾을 수 없습니다.' });

  programs[idx] = {
    ...programs[idx],
    title:        req.body.title        ?? programs[idx].title,
    amount:       req.body.amount       ?? programs[idx].amount,
    deadline:     req.body.deadline     ?? programs[idx].deadline,
    keywords:     req.body.keywords     != null ? toArray(req.body.keywords)               : programs[idx].keywords,
    ministry:     req.body.ministry     ?? programs[idx].ministry,
    category:     req.body.category     ?? programs[idx].category,
    eligibility:  req.body.eligibility  ?? programs[idx].eligibility,
    description:  req.body.description  ?? programs[idx].description,
    industries:   req.body.industries   != null ? toArray(req.body.industries, ['전체'])   : programs[idx].industries,
    companyTypes: req.body.companyTypes != null ? toArray(req.body.companyTypes, ['전체']) : programs[idx].companyTypes,
    minAge:       req.body.minAge       != null ? toNum(req.body.minAge)                   : programs[idx].minAge,
    maxAge:       req.body.maxAge       != null ? toNum(req.body.maxAge)                   : programs[idx].maxAge,
    link:         req.body.link         ?? programs[idx].link,
    region:       req.body.region       ?? programs[idx].region
  };
  writePrograms(programs);
  res.json({ success: true, program: programs[idx] });
});

// ── 공고 삭제
router.delete('/admin/programs/:id', (req, res) => {
  let programs = readPrograms();
  const before = programs.length;
  programs = programs.filter(p => p.id !== Number(req.params.id));
  if (programs.length === before) return res.status(404).json({ error: '공고를 찾을 수 없습니다.' });
  writePrograms(programs);
  res.json({ success: true });
});

// ── CSV 가져오기
// 헤더 순서: title,amount,deadline,keywords,ministry,category,eligibility,description,industries,companyTypes,minAge,maxAge,link,region
router.post('/admin/programs/import', (req, res) => {
  const { csv } = req.body;
  if (!csv) return res.status(400).json({ error: 'CSV 데이터가 없습니다.' });

  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return res.status(400).json({ error: '데이터가 없습니다. (헤더 + 1행 이상 필요)' });

  const headers = parseCSVLine(lines[0]);
  const programs = readPrograms();
  const imported = [];
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      const row = {};
      headers.forEach((h, idx) => { row[h.trim()] = (values[idx] || '').trim(); });

      if (!row.title) { errors.push(`줄 ${i + 1}: title 없음`); continue; }

      imported.push({
        id: nextId([...programs, ...imported]),
        title:        row.title,
        amount:       row.amount       || '-',
        deadline:     row.deadline     || '',
        keywords:     splitSemi(row.keywords),
        ministry:     row.ministry     || '',
        category:     row.category     || '',
        eligibility:  row.eligibility  || '',
        description:  row.description  || '',
        industries:   splitSemi(row.industries)  || ['전체'],
        companyTypes: splitSemi(row.companyTypes) || ['전체'],
        minAge:       row.minAge ? Number(row.minAge) : null,
        maxAge:       row.maxAge ? Number(row.maxAge) : null,
        link:         row.link    || '',
        region:       row.region  || '전국'
      });
    } catch (e) {
      errors.push(`줄 ${i + 1}: ${e.message}`);
    }
  }

  programs.push(...imported);
  writePrograms(programs);
  res.json({ success: true, imported: imported.length, errors });
});

// ── CSV 템플릿 다운로드
router.get('/admin/programs/template', (req, res) => {
  const header = 'title,amount,deadline,keywords,ministry,category,eligibility,description,industries,companyTypes,minAge,maxAge,link,region';
  const sample = '소상공인 창업 지원사업,최대 5000만원,2026-05-30,창업;소상공인,중소벤처기업부,창업,소상공인 및 예비창업자,사업화 자금 지원,전체,소상공인;소기업,,3,,전국';
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="programs_template.csv"');
  res.send('\uFEFF' + header + '\n' + sample); // BOM for Excel
});

// ── 발송 이력 조회
router.get('/admin/history', (req, res) => {
  const all = history.read();
  res.json({ count: all.length, history: [...all].reverse().slice(0, 100) });
});

// ── Helpers
function toArray(val, fallback = []) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return val.split(',').map(s => s.trim()).filter(Boolean);
  return fallback;
}
function toNum(val) {
  if (val === '' || val == null) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}
function splitSemi(str) {
  if (!str) return [];
  return str.split(';').map(s => s.trim()).filter(Boolean);
}
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQ = !inQ; }
    else if (line[i] === ',' && !inQ) { result.push(cur); cur = ''; }
    else { cur += line[i]; }
  }
  result.push(cur);
  return result;
}

module.exports = router;
