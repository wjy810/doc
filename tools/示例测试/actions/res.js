module.exports = async page => {
  const rows = await page.evaluate(() => window.__res.run());
  console.log(rows.map(r => `${r.s}: ${r.textures} tex ${r.mb.toFixed(0)}MB avg ${r.avg.toFixed(0)}ms back ${r.back.toFixed(0)}ms`).join('\n'));
  console.log('lose:', await page.evaluate(() => window.__res.lose()), '|', await page.textContent('#mem'));
};
