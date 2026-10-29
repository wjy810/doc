// 18-08 三维作品展：A、B、简化模式各运行一次（记录四个观察点），再分别固定高、中、低档测 4 秒帧时间
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const iframe = await page.$('#lab'), frame = await iframe.contentFrame(), box = await iframe.boundingBox();
  let seq = 0, origin = 0;
  async function start(q) {
    // 先停掉上一次的渲染并释放画布，等软件渲染把积压的帧做完，免得影响下一次的计时
    await frame.evaluate(() => window.__g && window.__g.stop()).catch(() => {});
    await page.evaluate(() => window.__gp.load(''));
    await sleep(1200);
    const n = ++seq;
    await page.evaluate(q => window.__gp.load(q), `${q}&n=${n}`);
    await frame.waitForURL(u => u.toString().includes('n=' + n), { waitUntil: 'commit' });
    await frame.waitForFunction(() => window.__g, null, { polling: 20 });
    origin = await frame.evaluate(() => performance.timeOrigin);
  }
  const until = async t => { const d = origin + t - Date.now(); if (d > 0) await sleep(d); };
  const mark = n => frame.waitForFunction(n => window.__g.marks[n] != null, n, { timeout: 40000, polling: 30 });
  const shot = async () => 'data:image/png;base64,' + (await page.screenshot({ clip: box })).toString('base64');
  const measure = () => frame.evaluate(() => window.__g.window(4000));
  const report = () => frame.evaluate(() => window.__g.report());
  const R = {}, shots = {};
  await page.screenshot({ clip: box });   // 预热：第一次截图较慢

  // A：等到可操作，立刻在画面上点目标作品
  await start('v=A');
  await until(1000); shots.A1t = Date.now() - origin; shots.A1 = await shot();
  await mark('可操作');
  const p = await frame.evaluate(i => window.__g.screenPos(i), 0);
  await page.mouse.click(box.x + p.x, box.y + p.y);
  await mark('任务完成'); await sleep(500);
  R.A = { win: await measure() }; shots.A2 = await shot(); R.A.rep = await report();

  // B：列表一出现就点
  await start('v=B');
  await mark('可操作（列表）');
  await frame.locator('#w-0').click();
  await mark('任务完成');
  await until(1000); shots.B1t = Date.now() - origin; shots.B1 = await shot();
  await mark('画质确定'); await mark('全部加载'); await sleep(500);
  R.B = { win: await measure() }; R.B.rep = await report();

  // 简化模式
  await start('v=S');
  await mark('可操作（列表）');
  await frame.locator('#w-0').click();
  await mark('任务完成'); await mark('全部加载'); await sleep(300);
  shots.S = await shot(); R.S = { rep: await report() };

  // 固定档位
  for (const t of ['high', 'mid', 'low']) {
    await start('v=B&tier=' + t);
    await mark('全部加载'); await sleep(500);
    R[t] = { win: await measure() }; R[t].rep = await report();
  }
  await frame.evaluate(() => window.__g && window.__g.stop()).catch(() => {});
  await page.evaluate(() => window.__gp.load(''));
  await page.evaluate(([R, shots]) => window.__gp.renderAll(R, shots), [R, shots]);
  for (const [k, x] of Object.entries(R)) console.log(k, JSON.stringify({ marks: Object.fromEntries(Object.entries(x.rep.marks).map(([a, b]) => [a, Math.round(b)])), fcp: Math.round(x.rep.fcp), lcp: x.rep.lcp, tier: x.rep.tier, log: x.rep.tierLog.map(l => `${Math.round(l.t)} ${l.p90.toFixed(1)} ${l.txt}`), lt: x.rep.longtasks.map(l => `${Math.round(l.t)}:${Math.round(l.d)}`).join(' '), tex: x.rep.mem.texMB.toFixed(1), win: x.win && [x.win.n, x.win.p50, x.win.p95, x.win.max, x.win.over33, x.win.longtasks].join(' ') }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
