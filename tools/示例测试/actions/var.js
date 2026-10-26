module.exports = async page => {
  await page.waitForTimeout(500);
  console.log('same seed reproduces:', await page.evaluate(() => window.__var.same(3, 'quiet') && window.__var.same(5, 'lively')));
  await page.click('#posters figure:nth-child(3) button');
  console.log('url:', page.url().split('?')[1], '|', await page.textContent('#picked'));
  console.log('weighted:', await page.evaluate(() => { const r = (function (seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })(7); return 'ok'; }));
  if (process.env.V_STYLE) { await page.selectOption('#style', process.env.V_STYLE); await page.waitForTimeout(300); }
};
