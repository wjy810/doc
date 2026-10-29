// 20-11 异步、生命周期与软件结构：页面内运行（含真实计时器）并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__al.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
