module.exports = async page => {
  const rows = await page.evaluate(() => window.__cloth.bench());
  console.log(rows.map(r => `iter ${r.iters}: mean ${(r.mean * 100).toFixed(2)}% max ${(r.max * 100).toFixed(1)}% ${r.ms.toFixed(2)}ms`).join('\n'));
  for (const p of [0, 1.2, 3]) console.log('soft pressure', p, JSON.stringify(await page.evaluate(p => window.__cloth.softTest(p), p)));
  // 截图：停住动画，布料推进 2.6 秒、软体在落地后
  await page.evaluate(() => { document.getElementById('clothReset').click(); document.getElementById('softReset').click(); });
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; window.__cloth.advance(1.15); });
};
