module.exports = async page => {
  const mode = process.env.P_MODE || 'shot';
  if (mode === 'measure') {
    const rows = await page.evaluate(() => window.__particles.measure());
    console.log('measure:', JSON.stringify(rows.map(r => ({ count: r.count, size: r.size, ms: +r.ms.toFixed(1) }))));
  }
  await page.evaluate(m => { const p = window.__particles; p.setPaused(true); p.uniforms.uTime.value = 2.6; p.uniforms.uOverdraw.value = m === 'overdraw' ? 1 : 0; p.render(); }, mode);
  await page.waitForTimeout(400);
};
