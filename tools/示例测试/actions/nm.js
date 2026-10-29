// 20-07 数值方法：页面内计算并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__nm.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
