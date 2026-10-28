// 11-11：等验收完成，打印结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__be.done);
  for (const t of r) console.log(`${t.pass ? 'PASS' : 'FAIL'} ${t.name}: ${t.detail}`);
};
