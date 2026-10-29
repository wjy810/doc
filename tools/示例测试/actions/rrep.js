// 21-13 项目 12：运行复现并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__rr.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
  if (process.env.H) await page.setViewportSize({ width: 1180, height: +process.env.H });
};
