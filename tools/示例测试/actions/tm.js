// 13-07：每种延迟用真实鼠标点击 12 次；然后排序并逐帧读取 FLIP 动画中被跟踪条目的位置
module.exports = async page => {
  const b = await page.locator('#probe').boundingBox(), xy = [b.x + 20, b.y + b.height / 2];
  for (const d of [0, 50, 100, 200, 500, 1000]) {
    await page.evaluate(d => window.__setDelay(d), d);
    for (let i = 0; i < 12; i++) { await page.mouse.click(...xy); await page.waitForTimeout(d + 90 + (i % 3) * 7); }
  }
  await page.waitForTimeout(300);
  const lat = await page.evaluate(() => window.__report());
  await page.evaluate(() => window.__sort()); await page.waitForTimeout(20);
  const cont = await page.evaluate(() => window.__continuity()); await page.waitForTimeout(400);
  console.log(JSON.stringify({ lat: lat.map(o => [o.d, o.n, +o.m.toFixed(1), +o.sd.toFixed(1), +o.min.toFixed(1), +o.max.toFixed(1)]), cont }));
};
