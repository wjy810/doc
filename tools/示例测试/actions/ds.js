// 20-10 数据模型与数据结构：页面内计算并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__ds.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
