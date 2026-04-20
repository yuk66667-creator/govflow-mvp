console.log('🔥 NIPA 실행됨');

const axios = require('axios');
const cheerio = require('cheerio');

async function crawlNIPA() {
  try {
    const { data } = await axios.get(
      'https://www.nipa.kr/home/2-2'
    );

    const $ = cheerio.load(data);
    const programs = [];

    $('table tbody tr').each((i, el) => {
      const title = $(el).find('td a').text().trim();
      const link =
        'https://www.nipa.kr' +
        $(el).find('td a').attr('href');

      const deadline = $(el).find('td').eq(2).text().trim();

      if (title) {
        programs.push({
          title,
          link,
          ministry: '정보통신산업진흥원',
          deadline,
          keywords: title.split(' ').slice(0, 3),
          source: 'nipa'
        });
      }
    });

    console.log('NIPA:', programs.length);

    return programs;
  } catch (e) {
    console.log('NIPA 실패');
    return [];
  }
}

module.exports = crawlNIPA;