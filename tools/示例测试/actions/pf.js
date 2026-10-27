// 09-09：运行全部测量，打印结果；截图前停在基准画面
module.exports = async page => {
  const caps = await page.evaluate(() => window.__pf.capInfo);
  console.log(caps.caps.map(c => c.join(' | ')).join('\n')); console.log(caps.tier);
  const r = await page.evaluate(() => window.__pf.benchAll());
  console.log(r.map(o => `${o.name}: calls ${o.calls} avg ${o.avg.toFixed(1)} cpu ${o.cpu.toFixed(1)} gpu ${o.gpu.toFixed(1)} p95 ${o.p95.toFixed(1)} max ${o.max.toFixed(1)} median ${o.median.toFixed(1)} >33 ${o.over33} half ${o.half.toFixed(1)} → ${o.verdict}`).join('\n'));
  await page.evaluate(() => window.__pf.show('base')); await page.waitForTimeout(200);
};
