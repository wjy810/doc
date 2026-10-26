module.exports = async page => {
  for (const n of ['tree', 'dla', 'rd']) { const t0 = Date.now(); const s = await page.evaluate(n => window.__growth.finish(n), n); console.log(n, `(${Date.now() - t0} ms):`, s); }
  if (process.env.RD) {
    await page.selectOption('#rdPreset', process.env.RD);
    console.log('rd', process.env.RD, await page.evaluate(() => window.__growth.finish('rd')));
  }
};
