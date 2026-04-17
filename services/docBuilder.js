/**
 * 사업계획서 빌더
 * company: { name, industry, size, revenue, age, ceo, need, plan, expected, budget }
 * program: { title, amount, deadline, ministry, keywords }
 */
function buildBusinessPlan(company, program) {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return {
    meta: {
      title: `${program.title} 사업계획서`,
      company: company.name,
      date: today,
      program: program.title,
      amount: program.amount,
      deadline: program.deadline
    },
    sections: [
      {
        id: 'overview',
        title: '1. 사업 개요',
        items: [
          { label: '사업명',    value: program.title },
          { label: '지원 기관', value: program.ministry || '-' },
          { label: '지원 금액', value: program.amount },
          { label: '신청 마감', value: program.deadline },
          { label: '신청 기업', value: company.name }
        ]
      },
      {
        id: 'company',
        title: '2. 신청 기업 현황',
        items: [
          { label: '기업명',    value: company.name },
          { label: '업종',      value: company.industry || '미입력' },
          { label: '기업 규모', value: company.size     || '미입력' },
          { label: '연 매출',   value: company.revenue  || '미입력' },
          { label: '업력',      value: company.age ? `${company.age}년` : '미입력' },
          { label: '대표자',    value: company.ceo      || '미입력' }
        ]
      },
      {
        id: 'need',
        title: '3. 지원 필요성',
        text: company.need || '(지원이 필요한 이유를 작성하세요.)'
      },
      {
        id: 'plan',
        title: '4. 사업 추진 계획',
        text: company.plan || '(세부 추진 계획을 작성하세요.)'
      },
      {
        id: 'expected',
        title: '5. 기대 성과',
        text: company.expected || '(기대되는 성과를 작성하세요.)'
      },
      {
        id: 'budget',
        title: '6. 예산 계획',
        items: [
          { label: '총 신청 금액', value: program.amount }
        ],
        text: company.budget || '(세부 예산 계획을 작성하세요.)'
      }
    ]
  };
}

/**
 * 사업계획서 → 인쇄용 HTML (브라우저 print → PDF 저장)
 */
function buildPreviewHTML(doc) {
  const sectionsHTML = doc.sections.map(section => {
    let content = '';

    if (section.items && section.items.length) {
      content += '<table class="info-table">';
      for (const item of section.items) {
        content += `<tr><th>${item.label}</th><td>${item.value}</td></tr>`;
      }
      content += '</table>';
    }

    if (section.text) {
      content += `<p class="section-text">${section.text.replace(/\n/g, '<br>')}</p>`;
    }

    return `<div class="section">
      <h2>${section.title}</h2>
      ${content}
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<title>${doc.meta.title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Malgun Gothic', '맑은 고딕', AppleGothic, sans-serif; background:#fff; color:#111; padding:48px; max-width:800px; margin:0 auto; }
  .print-btn { display:block; margin:0 auto 24px; padding:10px 28px; background:#1a3a6b; color:#fff; border:none; border-radius:6px; font-size:14px; cursor:pointer; }
  h1.doc-title { font-size:22px; text-align:center; margin-bottom:6px; padding-bottom:14px; border-bottom:3px solid #1a3a6b; }
  .doc-meta { text-align:center; color:#555; font-size:12px; margin-bottom:32px; }
  .section { margin-bottom:28px; }
  .section h2 { font-size:14px; background:#1a3a6b; color:#fff; padding:7px 12px; border-radius:4px; margin-bottom:10px; }
  .info-table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:10px; }
  .info-table th { background:#f0f4ff; width:130px; padding:7px 12px; border:1px solid #dde; text-align:left; font-weight:600; }
  .info-table td { padding:7px 12px; border:1px solid #dde; }
  .section-text { padding:12px; background:#fafafa; border:1px solid #eee; border-radius:4px; font-size:13px; line-height:1.9; min-height:72px; white-space:pre-wrap; }
  @media print { .print-btn { display:none; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">PDF로 저장 (인쇄 → PDF)</button>
<h1 class="doc-title">${doc.meta.title}</h1>
<p class="doc-meta">기업명: ${doc.meta.company}&nbsp;&nbsp;|&nbsp;&nbsp;작성일: ${doc.meta.date}</p>
${sectionsHTML}
<button class="print-btn" onclick="window.print()" style="margin-top:24px">PDF로 저장 (인쇄 → PDF)</button>
</body>
</html>`;
}

module.exports = { buildBusinessPlan, buildPreviewHTML };
