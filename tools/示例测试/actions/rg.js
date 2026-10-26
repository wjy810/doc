module.exports = async page => {
  for (const v of ['final', 'shadowMap', 'normals', 'hdr', 'edges']) {
    const r = await page.evaluate(v => window.__rg.frame(v), v);
    console.log(v, ':', r.order.join(' → '), `(${r.total.toFixed(1)} ms)`);
  }
  if (process.env.RG_VIEW) { await page.selectOption('#view', process.env.RG_VIEW); await page.waitForTimeout(300); }
  else await page.evaluate(() => window.__rg.frame('final'));
};
