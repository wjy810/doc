module.exports = async page => {
  const rows = await page.evaluate(() => window.__fluid.bench());
  console.log(rows.map(r => `iter ${r.iters}: div ${r.div.toExponential(2)} ${r.ms.toFixed(1)}ms`).join('\n'));
  await page.evaluate(() => window.__fluid.run(5));
};
