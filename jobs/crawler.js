const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.join(__dirname, '../data/programs.json');

async function crawlPrograms() {
  try {
    const { data } = await axios.get('https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do');

    const $ = cheerio.load(data);
    const programs = [];

    $('.table_Type_1 tbody tr').each((i, el) => {
      const title = $(el).find('.txt_l a').text().trim();
      const organization = $(el).find('td').eq(1).text().trim();
      const deadline = $(el).find('td').eq(3).text().trim();
      const url = 'https://www.bizinfo.go.kr' + $(el).find('.txt_l a').attr('href');

      if (title) {
       programs.push({
  title,
  amount: '',                 // 아직 없음 (나중에 추가)
  ministry: organization,     // 이름 맞춰줌
  eligibility: '',            // 일단 빈값
  deadline,
  link: url,                  // 이름 맞춰줌
  keywords: title.split(' ').slice(0, 3) // 추천용
});
      }
    });

    fs.writeFileSync(OUTPUT, JSON.stringify(programs, null, 2));

    console.log('크롤링 완료:', programs.length);
  } catch (err) {
    console.error('크롤링 실패:', err.message);
  }
}

if (require.main === module) {
  crawlPrograms();
}

module.exports = { crawlPrograms };