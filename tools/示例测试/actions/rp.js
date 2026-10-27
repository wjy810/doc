// 10-10：打印运行记录与多种子统计
module.exports = async page => {
  await page.waitForFunction(() => window.__rp, null, { timeout: 60000 });
  const r = await page.evaluate(() => window.__rp);
  for (const x of r.runs) console.log(`${x.name}: cfg ${x.cfg} data ${x.data} res ${x.res} sse ${x.sse.toFixed(9)}`);
  console.log(JSON.stringify(r.seedStats));
};
