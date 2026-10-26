module.exports = async page => {
  const rows = await page.evaluate(() => window.__sh.bench());
  console.log(rows.map(r => `${r.name}: ${r.size} ${r.mb.toFixed(1)}MB ${r.ms.toFixed(1)}ms`).join('\n'));
  await page.evaluate(() => window.__sh.freeze(1.2, 0.6)); await page.waitForTimeout(300);
};
