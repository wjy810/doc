// 10-08：打印各方法的步数、用时与误差
module.exports = async page => {
  const r = await page.evaluate(() => window.__sim);
  console.log('LIMIT', r.LIMIT, JSON.stringify(r.conv));
  for (const x of r.res) console.log(`${x.name} ratio ${x.ratio} steps ${x.steps} it ${x.it} ${x.ms.toFixed(0)}ms err ${(x.err * 100).toFixed(2)}% max ${x.maxv.toExponential(2)}`);
};
