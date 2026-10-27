// 10-06：打印五次优化的结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__inv);
  for (const x of r) console.log(`${x.name}: loss ${x.loss.toExponential(2)} albedo ${x.albedo.map(v => v.toFixed(3))} I ${x.I.toFixed(3)} angle ${x.angle.toFixed(2)} product ${x.product.map(v => v.toFixed(3))}`);
};
