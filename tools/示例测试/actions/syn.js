// 10-07：打印纹理合成的评价与重复性
module.exports = async page => {
  await page.waitForFunction(() => window.__syn, null, { timeout: 120000 });
  const r = await page.evaluate(() => window.__syn);
  for (const x of r.results) console.log(`${x.title}: seam ${x.seam.toFixed(1)} hist ${x.hist.toFixed(3)} reuse ${(x.reuse * 100).toFixed(0)}% ${x.ms.toFixed(0)}ms`);
  console.log('same seed identical:', r.same, 'different seed differs:', r.diff, r.h1, r.h3);
};
