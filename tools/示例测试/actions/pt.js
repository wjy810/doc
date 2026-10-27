// 09-12：等路径追踪全部完成，打印时间与噪声
module.exports = async page => {
  const r = await page.evaluate(() => window.__pt.done);
  console.log('raster', r.rasterMs.toFixed(1), 'ref(4096) s', (r.refTime / 1000).toFixed(1));
  for (const row of r.rows) console.log(row.spp, (row.time / 1000).toFixed(2) + 's', 'nee', row.nee.toFixed(4), 'naive', row.naive.toFixed(4));
};
