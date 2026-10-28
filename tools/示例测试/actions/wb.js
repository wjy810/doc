// 15-06：用真实鼠标完成分析任务：刷选 8 月 → 点“华南” → 按渠道分组 → 点“广告” → 按课程分组
module.exports = async page => {
  await page.waitForFunction(() => window.__wb, null, { timeout: 30000 });
  console.log(JSON.stringify(await page.evaluate(() => window.__wb.an)));
  const [x0, x1, y] = await page.evaluate(() => window.__wb.monthX(8));
  await page.mouse.move(x0 + 3, y); await page.mouse.down(); await page.mouse.move(x1 - 3, y, { steps: 6 }); await page.mouse.up();
  await page.waitForTimeout(200);
  const click = async v => { const [x, yy] = await page.evaluate(v => window.__wb.barXY(v), v); await page.mouse.click(x, yy); await page.waitForTimeout(150); };
  await click('华南');
  await page.click('#tabs button[data-k="channel"]'); await page.waitForTimeout(150);
  await click('广告');
  await page.click('#tabs button[data-k="course"]'); await page.waitForTimeout(150);
  await page.mouse.move(5, 5);
  console.log(JSON.stringify(await page.evaluate(() => window.__wb.state())));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
