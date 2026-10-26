module.exports = async page => {
  const r = (o) => `有序度 ${o.order.toFixed(2)} 群 ${o.groups} 邻居 ${o.neigh.toFixed(1)} 最近 ${o.near.toFixed(1)} ${o.ms.toFixed(2)}ms`;
  // 1. 参数相同：两边应完全相同
  let res = await page.evaluate(() => { window.__flock.setB({}); window.__flock.reset(); window.__flock.run(5); return window.__flock.same(); });
  console.log('identical params stay identical after 5 s:', res);
  // 2. 一组对比：A 默认，B 改一个参数，各运行 15 秒
  for (const [label, b] of [['对齐 0', { ali: 0 }], ['分离 4', { sep: 4 }], ['半径 15', { r: 15 }], ['聚集 0', { coh: 0 }]]) {
    const [a, bb] = await page.evaluate(b => { window.__flock.setB(b); window.__flock.reset(); return window.__flock.run(15); }, b);
    console.log(`A 默认: ${r(a)} | B ${label}: ${r(bb)}`);
  }
  // 3. 成本
  for (const n of [200, 600, 1500]) console.log(`n=${n}: ${(await page.evaluate(n => window.__flock.cost(n), n)).toFixed(2)} ms/step`);
  // 4. 暂停、继续、重置
  await page.click('#pause'); const p1 = await page.evaluate(() => window.__flock.paused);
  await page.click('#pause'); const p2 = await page.evaluate(() => window.__flock.paused);
  console.log('pause →', p1, 'resume →', p2);
  // 截图：A 默认，B 对齐 0，运行 12 秒并记录
  await page.evaluate(() => { window.__flock.setB({ ali: 0 }); window.__flock.reset(); window.__flock.run(12); window.__flock.record(1); window.__flock.setB({ sep: 4 }); window.__flock.reset(); window.__flock.run(12); window.__flock.record(2); window.__flock.setB({ ali: 0 }); window.__flock.reset(); window.__flock.run(12); });
};
