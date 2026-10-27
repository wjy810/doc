// 10-11：打印复现检查的全部数字
module.exports = async page => {
  const r = await page.evaluate(() => window.__bp);
  console.log('min/r', Math.min(...r.mins).toFixed(5), Math.max(...r.mins).toFixed(5), 'steps', JSON.stringify(r.steps.slice(0, 3)), 'all equal', r.steps.every(([a, b]) => a === b));
  console.log('lowRatio', r.lowRatio.toFixed(4), 'main 10 runs ms', r.tMain.toFixed(0));
  for (const s of r.scaling) console.log(`r ${s.r}: N ${s.N} step2 ${s.step2} ${s.ms.toFixed(1)}ms ${(s.ms / s.N * 1000).toFixed(2)}ms/k`);
  for (const h of r.hard) console.log(`${h.name}: N ${h.N} free ${(h.frac * 100).toFixed(2)}% ${h.ms.toFixed(0)}ms`);
};
