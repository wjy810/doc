// 11-03：打印对比度与结构检查结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__tk);
  for (const c of r.contrast) console.log(`${c.label} ${c.theme}: ${c.r.toFixed(2)} ${c.pass ? 'PASS' : 'FAIL'}`);
  console.log(JSON.stringify(r.problems), JSON.stringify(r.counts), r.cssLines);
};
