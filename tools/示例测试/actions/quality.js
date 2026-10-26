// Q_MODE=auto：观察自动降档；Q_MODE=bench：瓶颈测试；Q_MODE=shot-<档位>：截图该档位
module.exports = async page => {
  const mode = process.env.Q_MODE || 'auto';
  if (mode === 'auto') {
    for (let i = 0; i < 8; i++) { await page.waitForTimeout(1000); console.log('t=' + (i + 1) + 's', await page.textContent('#auto'), '| tier', await page.evaluate(() => window.__quality.tier)); }
  }
  if (mode === 'bench') {
    for (const t of ['high', 'low']) {
      await page.click(`[data-tier="${t}"]`); await page.waitForTimeout(500);
      const rows = await page.evaluate(() => window.__quality.bottleneck());
      console.log(t, rows.map(([l, ms]) => `${l} ${ms.toFixed(1)}`).join(' | '), '=>', await page.textContent('#verdict'));
    }
  }
  if (mode.startsWith('shot-')) {
    const t = mode.slice(5);
    await page.click(`[data-tier="${t}"]`);
    await page.evaluate(() => { window.__quality.stopAuto(); window.__quality.setTime(3.2); });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.__quality.setTime(3.2));
  }
};
