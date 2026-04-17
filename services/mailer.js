require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function buildHTMLEmail(email, matchedPrograms) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  const programsHTML = matchedPrograms.length === 0
    ? `<p style="color:#6b7a99;text-align:center;padding:24px 0">
        키워드에 맞는 지원사업을 찾지 못했습니다.<br>
        키워드를 다양하게 등록하시면 더 많은 사업을 추천받을 수 있습니다.
       </p>`
    : matchedPrograms.map(p => {
        const reasons = (p.reasons || []).join(' · ') || `키워드: ${(p.matchedKeywords||[]).join(', ')}`;
        const link = p.link
          ? `<a href="${p.link}" style="display:inline-block;margin-top:10px;padding:6px 14px;background:#1a3a6b;color:#fff;border-radius:4px;text-decoration:none;font-size:12px">공고 바로가기 →</a>`
          : '';
        return `
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:18px;margin-bottom:16px;border-left:4px solid #4a90e2">
          <div style="font-weight:700;font-size:15px;color:#1a1a2e;margin-bottom:6px">${p.title}</div>
          <div style="font-size:20px;font-weight:700;color:#1a3a6b">${p.amount}</div>
          <div style="font-size:12px;color:#6b7a99;margin-top:4px">${p.ministry || ''}</div>
          <div style="font-size:12px;color:#e74c3c;margin-top:4px;font-weight:600">마감: ${p.deadline}</div>
          <div style="background:#f0f4ff;padding:6px 10px;border-radius:4px;font-size:12px;color:#4a5568;margin-top:10px">추천 이유: ${reasons}</div>
          ${link}
        </div>`;
      }).join('');

  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#f4f6fb;font-family:'Malgun Gothic',AppleGothic,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
    <div style="background:#1a3a6b;padding:28px 24px;text-align:center">
      <div style="color:#fff;font-size:22px;font-weight:700">GovFlow</div>
      <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:4px">오늘의 맞춤 정부지원사업 추천 · ${today}</div>
    </div>
    <div style="padding:28px 24px">
      <p style="font-size:14px;color:#4a5568;margin-bottom:20px">
        안녕하세요! 등록하신 조건에 맞는 지원사업을 추천해드립니다.
      </p>
      ${programsHTML}
    </div>
    <div style="background:#f8f9fa;padding:16px 24px;text-align:center;font-size:11px;color:#9ba8c0;border-top:1px solid #eef0f7">
      본 메일은 GovFlow 자동 추천 시스템에서 발송되었습니다.<br>
      수신 거부를 원하시면 이 메일에 회신해 주세요.
    </div>
  </div>
</body>
</html>`;
}

async function sendRecommendationEmail(email, matchedPrograms) {
  const html = buildHTMLEmail(email, matchedPrograms);

  const mailOptions = {
    from: `"GovFlow 지원사업 추천" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `[GovFlow] 오늘의 맞춤 지원사업 ${matchedPrograms.length}건 추천`,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[MAIL] Sent to ${email} → ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MAIL] Failed to send to ${email}:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendRecommendationEmail };
