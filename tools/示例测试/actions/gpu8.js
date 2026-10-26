module.exports = async page => {
  const rows = await page.evaluate(() => window.__gpu.bench());
  console.log(rows.map(r => `${r.n}: cpu ${r.cpu.toFixed(2)} gpu ${r.gpu.toFixed(2)}`).join(' | '));
  await page.evaluate(() => window.__gpu.freeze()); await page.waitForTimeout(300);
};
