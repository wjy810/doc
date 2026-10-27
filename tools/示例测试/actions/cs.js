// 09-08：依次运行三个实验，打印结果，滚动到顶部截图
module.exports = async page => {
  await page.evaluate(() => window.__cs.ready);
  const gpu = await page.evaluate(() => window.__cs.hasGPU());
  console.log('GPU:', gpu, await page.locator('#env').textContent());
  const h = await page.evaluate(() => window.__cs.runHist());
  console.log(h.map(r => `${r.name}: ${r.ms.toFixed(1)}ms ${r.ok ? 'OK' : 'DIFF ' + r.diff + ' total ' + r.total}`).join('\n'));
  const p = await page.evaluate(() => window.__cs.runParticles());
  console.log(p.map(r => `${r.layout} wg${r.wg}: ${r.ms.toFixed(2)}ms ${r.check}`).join('\n'));
  const t = await page.evaluate(() => window.__cs.runTransfer());
  console.log(t.map(r => `${r.n}: cpu ${r.cpu.toFixed(2)} up ${r.up?.toFixed(2)} comp ${r.comp?.toFixed(2)} down ${r.down?.toFixed(2)}`).join('\n'));
};
