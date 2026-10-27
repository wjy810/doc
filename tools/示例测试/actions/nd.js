// 11-07：打印检查结果、日志与规模测试
module.exports = async page => {
  const r = await page.evaluate(() => window.__nd);
  for (const [a, b] of r.checks) console.log(`${a} => ${b}`);
  console.log(await page.locator('#scale').innerText());
};
