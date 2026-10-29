// 18-12 问题定位：依次运行十张卡片的测量
module.exports = async page => {
  const out = await page.evaluate(() => window.__dx.runAll());
  for (const [id, b, a] of out) console.log(id, JSON.stringify(b), '→', JSON.stringify(a));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
