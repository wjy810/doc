// 21-03 项目 02：测量三个方向并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__td.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
