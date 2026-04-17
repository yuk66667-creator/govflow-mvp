const express = require('express');
const router = express.Router();
const { buildBusinessPlan, buildPreviewHTML } = require('../services/docBuilder');

// POST /api/documents/generate — JSON 구조 반환
router.post('/documents/generate', (req, res) => {
  const { company, program } = req.body;
  if (!company || !program)
    return res.status(400).json({ error: '기업 정보와 프로그램 정보를 입력하세요.' });
  const doc = buildBusinessPlan(company, program);
  res.json({ success: true, document: doc });
});

// POST /api/documents/preview — 인쇄용 HTML 반환 (PDF 저장)
router.post('/documents/preview', (req, res) => {
  const { company, program } = req.body;
  if (!company || !program)
    return res.status(400).json({ error: '기업 정보와 프로그램 정보를 입력하세요.' });
  const doc = buildBusinessPlan(company, program);
  const html = buildPreviewHTML(doc);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

module.exports = router;
