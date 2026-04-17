const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { matchPrograms } = require('../services/matcher');
const { sendRecommendationEmail } = require('../services/mailer');

function extractKeywords(title) {
  const keywords = [];

  if (title.includes('수출')) keywords.push('수출');
  if (title.includes('마케팅')) keywords.push('마케팅');
  if (title.includes('창업')) keywords.push('창업');
  if (title.includes('AI')) keywords.push('AI');
  if (title.includes('디지털')) keywords.push('디지털');

  return keywords.length ? keywords : ['기타'];
}

async function fetchPrograms() {
  console.log('[JOB] 공공 API 데이터 수집 시작');

  try {
    const SERVICE_KEY = process.env.API_KEY;

    const { data } = await axios.get(
      'https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01',
      {
        params: {
          serviceKey: SERVICE_KEY,
          numOfRows: 20,
          pageNo: 1,
          resultType: 'json'
        }
      }
    );

    const items =
      data?.response?.body?.items?.item || [];

    const programs = items.map((item, i) => ({
      id: i + 1,
      title: item.pbancNm,
      description: item.pbancCn,
      keywords: extractKeywords(item.pbancNm),
      ministry: item.instNm || '창업진흥원',
      category: '창업지원',
      industries: ['전체'],
      companyTypes: ['전체'],
      region: '전국',
      deadline: item.pbancEndDt || ''
    }));

    fs.writeFileSync(
      path.join(__dirname, '../data/programs.json'),
      JSON.stringify(programs, null, 2)
    );

    console.log(`[JOB] ${programs.length}개 저장 완료`);

  } catch (err) {
    console.error('[JOB] API 수집 실패:', err.message);
  }
}

const USERS_FILE = path.join(__dirname, '../data/users.json');

async function runDailyJob() {
  console.log(`[JOB] Daily recommendation job started at ${new Date().toISOString()}`);

  await fetchPrograms();

  let users = [];
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    users = JSON.parse(raw);
  } catch (err) {
    console.error('[JOB] Failed to read users.json:', err.message);
    return;
  }

  if (users.length === 0) {
    console.log('[JOB] No users found. Skipping.');
    return;
  }

  console.log(`[JOB] Processing ${users.length} user(s)...`);

  for (const user of users) {
   const matched = matchPrograms(user.keywords);
    console.log(`[JOB] ${user.email} → ${matched.length} program(s) matched`);
    await sendRecommendationEmail(user.email, matched);
  }

  console.log('[JOB] Daily job completed.');
}

function startScheduler() {
  // Run every day at 09:00 AM KST
  cron.schedule('0 9 * * *', () => {
    runDailyJob();
  }, {
    timezone: 'Asia/Seoul'
  });

  console.log('[SCHEDULER] Daily job scheduled at 09:00 KST');
}

module.exports = { startScheduler, runDailyJob };
