// 11-10：打印候选的检查、修改记录与统计
module.exports = async page => {
  const r = await page.evaluate(() => window.__as);
  r.cands.forEach((c, i) => console.log(`候选${i + 1}: diff ${c.diff.join(',')} | ${c.problems.join('；') || 'OK'}`));
  for (const h of r.history) console.log(`${h.source} | ${h.change} | ${h.status}`);
  console.log('passAll', r.passAll, JSON.stringify(r.counts));
};
