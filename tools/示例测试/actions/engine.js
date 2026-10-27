// 09-10：截四种调试视图（保存到 SHOTS 目录），再依次删除产品 B、模拟泄漏、模拟参数写错
const path = require('path');
module.exports = async page => {
  const dir = process.env.SHOTS || '.';
  for (const v of ['none', 'normals', 'overdraw', 'bounds']) {
    const d = await page.evaluate(v => window.__en.view(v), v);
    console.log(v, JSON.stringify(d));
    await page.locator('#view').screenshot({ path: path.join(dir, `engine-${v}.png`) });
  }
  await page.evaluate(() => window.__en.view('none'));
  await page.evaluate(() => window.__en.click('remove'));
  await page.evaluate(() => window.__en.click('leak'));
  await page.evaluate(() => window.__en.click('typo'));
  console.log(await page.locator('#log').textContent());
  console.log(await page.locator('#stats').textContent());
};
