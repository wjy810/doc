// 20-09 图论、几何算法与优化：页面内计算并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__go.run());
  console.log(JSON.stringify(r, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
