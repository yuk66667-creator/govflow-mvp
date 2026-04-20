const axios = require('axios');
const cheerio = require('cheerio');

async function crawlKosmes() {
  try {
    console.log('🔥 KOSMES 실행됨');

    const { data } = await axios.get(
      'https://www.kosmes.or.kr/sbc/SH/NTS/SHNTS001M0.do'
    );

    const $ = cheerio.load(data);
    const programs = [];

    // 👉 a 태그 전체 긁기 (핵심)
   $('a').each((i, el) => {
  const title = $(el).text().trim();

  if (
    title.length > 10 &&
    (title.includes('지원') ||
     title.includes('사업') ||
     title.includes('모집')) &&
    !title.includes('로그인') &&
    !title.includes('메뉴') &&
    !title.includes('이용') &&
    !title.includes('센터')
  ) {
    programs.push({
      title,
      ministry: '중진공',
      deadline: '',
      link: '',
      source: 'kosmes'
    });
  }
});
    console.log('KOSMES:', programs.length);

    return programs.slice(0, 20);
  } catch (e) {
    console.log('KOSMES 실패:', e.message);
    return [];
  }
}

module.exports = crawlKosmes;