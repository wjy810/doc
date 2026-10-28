// 12-02：用真实鼠标点击五个按钮，读取 Event Timing 条目；再由脚本完成三项任务
module.exports = async page => {
  const center = async id => { const b = await page.locator(id).boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  for (const id of ['#b0', '#b80', '#b300', '#bsplit']) { await page.mouse.click(...await center(id)); await page.waitForTimeout(700); }
  const xy = await center('#blong');                       // 先取坐标：主线程被占用时页面里的脚本也无法运行
  await page.evaluate(() => window.__longTask(250)); await page.waitForTimeout(30); await page.mouse.click(...xy);
  await page.waitForTimeout(800);
  const r = await page.evaluate(() => window.__report());
  for (const o of r) console.log(`${o.name} | ${Math.round(o.duration)} | delay ${o.delay.toFixed(1)} proc ${o.proc.toFixed(1)} pres ${o.pres.toFixed(1)} | done ${Math.round(o.done)}${o.below ? ' (below threshold)' : ''}`);
  // 任务：T1 先点错一次再找到；T2 先搜索再点击；T3 两次搜索无果后放弃
  const tap = async (sel, wait = 400) => { await page.click(sel); await page.waitForTimeout(wait); };
  const search = async (q, wait = 500) => { await page.fill('#search', q); await page.press('#search', 'Enter'); await page.waitForTimeout(wait); };
  await tap('#start', 1500); await tap('[data-c="数据分析与统计"]', 900); await tap('[data-c="数据可视化"]');
  await tap('#start', 800); await search('研究', 600); await tap('[data-c="用户研究方法"]');
  await tap('#start', 700); await search('三维', 1500); await search('建模', 1000); await tap('#giveup');
  console.log(await page.evaluate(() => JSON.stringify(window.__tasks.tasks.map(t => [t.id, t.result, Math.round(t.time), t.errors, t.searches, t.steps]))));
};
