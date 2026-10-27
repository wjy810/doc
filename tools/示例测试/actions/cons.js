// 11-06：打印每种尺寸的排法与调整
module.exports = async page => {
  await page.waitForFunction(() => window.__cs, null, { timeout: 30000 });
  const r = await page.evaluate(() => window.__cs);
  for (const x of r) console.log(`${x.name} ${x.mode} ${x.size.toFixed(1)}px ${x.ms.toFixed(1)}ms | ${x.log.join('；')}`);
};
