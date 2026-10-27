// 10-05：打印重建结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__rec);
  for (const x of r) console.log(`N ${x.N} sigma ${x.sigma}: iou ${x.iou.toFixed(3)} extra ${(x.extra * 100).toFixed(1)}% miss ${(x.miss * 100).toFixed(1)}% novel ${x.novel.toFixed(3)}`);
};
