const axios = require('axios');
const cheerio = require('cheerio');

async function crawlSBA() {
  try {
    console.log('🔥 SBA 실행됨');

    const { data } = await axios.get(
      'https://www.sba.seoul.kr/Pages/BusinessSupport/Project.aspx'
    );

    const $ = cheerio.load(data);
    const programs = [];

    $('a').each((i, el) => {
      const title = $(el).text().trim();

      // 👉 조건 완화 (핵심)
      if (
        title.includes('지원') ||
        title.includes('사업') ||
        title.includes('모집')
      ) {
        programs.push({
          title,
          link: '',
          ministry: '서울경제진흥원',
          deadline: '',
          keywords: title.split(' ').slice(0, 3),
          source: 'sba'
        });
      }
    });

    console.log('SBA 결과:', programs.length);

    return programs.slice(0, 20);
  } catch (e) {
    console.log('SBA 실패:', e.message);
    return [];
  }
}

module.exports = crawlSBA;