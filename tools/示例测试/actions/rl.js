// 12-11：模拟一位参与者——先用表格做任务 1（逐行查找），再用原型做三项任务（中间来回点击 DOM 触发困惑信号）
module.exports = async page => {
  for (const n of ['D3', 'SVG', 'DOM', '数据清洗', 'HTML', 'CSS', 'JavaScript', '统计基础']) { await page.click(`#ctrl tr[data-n="${n}"]`); await page.waitForTimeout(120); }
  const node = async (n, opt = {}) => { const b = await page.locator(`#graph g[data-n="${n}"]`).boundingBox(); if (opt.shift) await page.keyboard.down('Shift'); await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); if (opt.shift) await page.keyboard.up('Shift'); await page.waitForTimeout(150); };
  await node('D3');
  const a1 = await page.locator('#answer').innerText();
  await node('DOM'); await node('DOM'); await node('DOM');
  await page.selectOption('#role', '数据可视化工程师'); await page.waitForTimeout(150);
  await node('CSS', { shift: true }); await node('JavaScript', { shift: true });
  const a2 = await page.locator('#answer').innerText();
  await node('SVG');
  const a3 = await page.locator('#answer').innerText();
  await page.evaluate(() => window.__rel.observe('迁移题', '“为什么学 Canvas 不能跳过 JavaScript？”回答：Canvas 要通过 DOM 取得画布，而 DOM 依赖 JavaScript', ''));
  console.log(JSON.stringify({ a1, a2, a3, tasks: await page.evaluate(() => window.__rel.taskData), obs: await page.evaluate(() => window.__rel.obs) }, null, 1));
};
