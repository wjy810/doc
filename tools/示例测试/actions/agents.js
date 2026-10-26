module.exports = async page => {
  for (const w of [30, 50, 90]) {
    const r = await page.evaluate(w => { window.__agents.setExit(w); return window.__agents.run(120); }, w);
    console.log(`exit ${w}:`, JSON.stringify(r));
  }
  const rows = await page.evaluate(() => window.__agents.bench());
  console.log(rows.map(r => `${r.n}: naive ${r.naive.ms.toFixed(1)}ms ${r.naive.checks} / grid ${r.grid.ms.toFixed(1)}ms ${r.grid.checks}`).join('\n'));
  console.log(await page.textContent('#benchNote'));
  // 截图状态：出口 50，运行 9 秒
  await page.evaluate(() => { window.__agents.setExit(50); window.__agents.run(9); });
};
