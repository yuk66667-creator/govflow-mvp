console.log('🔥 crawler.js 실행됨');

const fs = require('fs');
const path = require('path');
const { crawlAll } = require('./crawler/index');

async function run() {
  const programs = await crawlAll();

  fs.writeFileSync(
    path.join(__dirname, '../data/programs.json'),
    JSON.stringify(programs, null, 2)
  );

  console.log('총 개수:', programs.length);
}

run();