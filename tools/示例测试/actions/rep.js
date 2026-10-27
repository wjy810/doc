// 10-04：打印五种表示的评价结果
module.exports = async page => {
  const r = await page.evaluate(() => window.__rep);
  for (const x of r) console.log(`${x.name} ${x.bytes}B ${x.what} iou ${x.iou == null ? '-' : x.iou.toFixed(4)} bErr ${x.bErr.toFixed(3)}% handle ${x.handle == null ? '-' : (x.handle * 100).toFixed(1)}%`);
};
