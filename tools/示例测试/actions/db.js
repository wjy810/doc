// 20-12 设计基础与研究基础：页面内测量与检查并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__db.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
