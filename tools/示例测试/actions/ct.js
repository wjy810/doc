// 20-03 坐标、单位与三角函数：页面内计算并填表
module.exports = async page => {
  const r = await page.evaluate(() => window.__ct.run());
  console.log(JSON.stringify(r));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
