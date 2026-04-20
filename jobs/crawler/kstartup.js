const puppeteer = require('puppeteer');

async function crawlKstartup() {
  try {
    console.log('kstartup 실행됨');

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    await page.goto(
      'https://www.k-startup.go.kr/web/contents/bizpbanc-ongoing.do',
      { waitUntil: 'networkidle2' }
    );

    // 🔥 강제 대기 (중요)
    await new Promise((r) => setTimeout(r, 3000));

    const programs = await page.evaluate(() => {
      const result = [];

      // 👉 다양한 선택자 시도 (핵심)
      const items =
        document.querySelectorAll('li') ||
        document.querySelectorAll('.list_box li');

      items.forEach((el) => {
        const title = el.innerText?.trim();

        if (title && title.length > 10) {
          result.push({
            title,
            link: '',
            ministry: '창업진흥원',
            deadline: '',
            keywords: title.split(' ').slice(0, 3),
            source: 'kstartup'
          });
        }
      });

      return result;
    });

    await browser.close();

    console.log('kstartup 결과:', programs.length);

    return programs.slice(0, 20); // 너무 많으면 자름
  } catch (e) {
    console.log('kstartup 실패:', e.message);
    return [];
  }
}

module.exports = crawlKstartup;