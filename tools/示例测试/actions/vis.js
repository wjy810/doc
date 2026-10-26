module.exports = async page => {
  const rows = await page.evaluate(() => window.__vis.bench());
  console.log(rows.map(r => `${r.label}: calls ${r.calls} tris ${r.tris} ${r.ms.toFixed(1)}ms`).join('\n'));
  console.log('lod:', JSON.stringify(await page.evaluate(() => window.__vis.lodTest())));
  await page.evaluate(() => window.__vis.freeze()); await page.waitForTimeout(200);
  console.log(await page.textContent('#stats'));
};
