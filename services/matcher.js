const keywordMap = {
  export: "수출",
  marketing: "마케팅",
  startup: "창업",
  tech: "기술",
  ai: "AI"
};

const fs = require('fs');
const path = require('path');

const PROGRAMS_FILE = path.join(__dirname, '../data/programs.json');

function readPrograms() {
  try {
    return JSON.parse(fs.readFileSync(PROGRAMS_FILE, 'utf-8'));
  } catch {
    return require('../mock/programs');
  }
}

function matchPrograms(userOrKeywords) {
  const isUser = !Array.isArray(userOrKeywords);
  const user = isUser ? userOrKeywords : { keywords: userOrKeywords };

  const rawKeywords = user.keywords || [];
  const userKeywords = rawKeywords.map(k => keywordMap[k] || k);

  const programs = readPrograms();

  const results = programs
    .map(p => {
      let score = 0;
      const reasons = [];

      const text = `${p.title || ''} ${p.description || ''}`.toLowerCase();

      // ✅ 1) 제목/설명 기반 매칭 (핵심 추가)
      const matchedKeywords = userKeywords.filter(kw =>
        text.includes(kw.toLowerCase())
      );

      if (matchedKeywords.length) {
        score += matchedKeywords.length * 3;
        reasons.push(`텍스트매칭: ${matchedKeywords.join(', ')}`);
      }

      // 기존 keywords도 보조로 사용
      const keywordMatch = userKeywords.filter(kw =>
        (p.keywords || []).some(pk => pk.includes(kw))
      );

      if (keywordMatch.length) {
        score += keywordMatch.length;
        reasons.push(`키워드필드: ${keywordMatch.join(', ')}`);
      }

      // 2) 업종
      if (user.industry && p.industries?.length) {
        if (
          p.industries.includes('전체') ||
          p.industries.some(i => i.includes(user.industry))
        ) {
          score += 2;
          reasons.push('업종');
        }
      }

      // 3) 기업형태
      if (user.companyType && p.companyTypes?.length) {
        if (
          p.companyTypes.includes('전체') ||
          p.companyTypes.includes(user.companyType)
        ) {
          score += 2;
          reasons.push('기업형태');
        }
      }

      if (score === 0) return null;

      return { ...p, matchedKeywords, score, reasons };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return results;
}

module.exports = { matchPrograms };