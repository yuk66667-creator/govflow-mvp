const axios = require('axios');
const cheerio = require('cheerio');

async function crawlBizinfo() {
  try {
    const { data } = await axios.get(
      'https://www.bizinfo.go.kr/web/lay1/bbs/S1T122C128/AS/74/list.do'
    );

    const $ = cheerio.load(data);
    const programs = [];

    const rows = $('.table_Type_1 tbody tr').slice(0, 10); // 일단 10개만

    for (let el of rows) {
      const title = $(el).find('.txt_l a').text().trim();
      const link =
        'https://www.bizinfo.go.kr' +
        $(el).find('.txt_l a').attr('href');

      // 👉 상세페이지 들어감
      const detailRes = await axios.get(link);
const $$ = cheerio.load(detailRes.data);

const text = $$('.view_cont').text();

// 기관
const ministryMatch = text.match(/소관부처\s*:\s*(.+)/);
const ministry = ministryMatch ? ministryMatch[1].trim() : '';

// 마감일
const dateMatch = text.match(/\d{4}\.\d{2}\.\d{2}/);
const deadline = dateMatch
  ? dateMatch[0].replace(/\./g, '-')
  : '';
      programs.push({
        title,
        ministry,
        deadline,
        link,
        source: 'bizinfo'
      });
    }

    console.log('bizinfo:', programs.length);

    return programs;
  } catch (err) {
    console.error(err.message);
    return [];
  }
}

module.exports = crawlBizinfo;