// 12-08：拖动阻尼滑块、回答两道预测题（第一题故意答错）、点击参数地图，最后把方块定格在 0.35 秒
module.exports = async page => {
  const setRange = async (id, v) => { await page.evaluate(([id, v]) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input')); }, [id, v]); await page.waitForTimeout(150); };
  await setRange('c', 4); await setRange('c', 8);
  await page.click('#quiz button[data-i="1"]'); await page.waitForTimeout(200);
  await page.click('#quiz button[data-i="1"]'); await page.waitForTimeout(200);
  const box = await page.locator('#map').boundingBox(), S = box.width / 520;
  const kx = k => 50 + (k - 20) / 380 * 400, cy = c => 10 + (50 - c) / 49 * 210;
  await page.mouse.click(box.x + kx(300) * S, box.y + cy(12) * S); await page.waitForTimeout(200);
  await page.evaluate(() => window.__ex.freeze(0.35));
  const r = await page.evaluate(() => ({ q: window.__ex.qlog, i: window.__ex.ilog, ver: window.__ex.ver, k: document.getElementById('k').value, c: document.getElementById('c').value, zeta: document.getElementById('zeta').innerText }));
  console.log(JSON.stringify(r, null, 1));
};
