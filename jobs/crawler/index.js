console.log('🔥 index.js 실행됨');

async function crawlAll() {
  const bizinfo = require('./bizinfo');
  const nipa = require('./nipa');
  const sba = require('./sba');
  const kosmesFn = require('./kosmes');

 // sba 제거 버전 (추천)
const results = await Promise.all([
  bizinfo().catch(() => []),
  nipa().catch(() => []),
  kosmesFn().catch(() => [])
]);

  return results.flat();
}

module.exports = { crawlAll };