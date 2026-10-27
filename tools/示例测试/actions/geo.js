// 10-03：等全部计算完成，打印结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__geo.done);
  console.log('original', JSON.stringify(r.original));
  for (const x of r.results) console.log(`${x.name} ${x.ratio}: tris ${x.tris} ${x.ms.toFixed(0)}ms mean ${x.mean.toFixed(3)}% max ${x.max.toFixed(3)}% nd ${x.nd.toFixed(2)} chi ${x.chi} b ${x.boundary} nm ${x.nonManifold}`);
  console.log('repair', JSON.stringify(r.repair));
  console.log('smooth', JSON.stringify(r.smooth));
};
