// 20-08 统计与实验设计：页面内模拟并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__se.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
