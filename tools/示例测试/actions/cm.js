// 15-08：测量两个缩放级别的触控目标与标注；依次模拟七种定位结果；点“东区”，在列表中点“第二食堂”
module.exports = async page => {
  await page.waitForFunction(() => window.__cm, null, { timeout: 30000 });
  const rows = []; for (const z of [15, 16, 18]) rows.push(await page.evaluate(z => window.__cm.measureAt(z), z));
  console.log(JSON.stringify(rows));
  await page.evaluate(() => window.__cm.map.setView([31.2, 121.0], 16, { animate: false }));
  await page.waitForTimeout(200);
  const geo = [];
  for (const m of ['denied', 'unavailable', 'timeout', 'outside', 'inaccurate', 'unsupported', 'ok']) geo.push(await page.evaluate(m => window.__cm.locate(m), m));
  console.log(JSON.stringify(geo));
  await page.click('#zones button[data-z="东区"]'); await page.waitForTimeout(150);
  const li = page.locator('#list li', { hasText: '第二食堂' }); await li.click(); await page.waitForTimeout(400);
  await page.evaluate(([r, g]) => window.__cm.report(r, g), [rows, geo]);
  console.log(JSON.stringify(await page.evaluate(() => ({ before: { bad: window.__cm.before.bad.length, out: window.__cm.before.outside.length, notIn: window.__cm.before.notInB.map(f => f.name) }, after: { bad: window.__cm.after.bad.length, out: window.__cm.after.outside.length, notIn: window.__cm.after.notInB.length }, off: window.__cm.off, spread: window.__cm.spread, list: document.getElementById('listTitle').textContent, detail: document.getElementById('detail').innerText }))));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
