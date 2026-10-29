// 18-07 感知性能：A、B 各运行五次——一次截胶片图，三次只加载不操作（取中位数），一次在初始化计算期间按下“收藏”
const FILM = [200, 800, 1500, 1950, 3200];
module.exports = async page => {
  const iframe = await page.$('#lab');
  const frame = await iframe.contentFrame();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let seq = 0;
  async function start(v, run) {
    const before = await page.evaluate(() => window.__pp.count());
    const tag = `${run}-${++seq}`;
    await page.evaluate(([v, run]) => window.__pp.load(v, run), [v, run + '&n=' + seq]);
    await frame.waitForURL(u => u.toString().includes('n=' + seq), { waitUntil: 'commit' });
    const origin = await frame.evaluate(() => performance.timeOrigin);
    return { origin, before, tag };
  }
  // 用 Node 的时钟等到框架里的某个时刻：框架主线程忙时也不受影响
  const until = async (origin, t) => { const d = origin + t - Date.now(); if (d > 0) await sleep(d); };
  const done = before => page.waitForFunction(n => window.__pp.count() > n, before, { timeout: 20000 });
  const film = {}, clip = await iframe.boundingBox(), took = [];
  await page.screenshot({ clip });   // 预热：第一次截图较慢
  for (const v of ['A', 'B']) {
    let { origin, before } = await start(v, 'f');
    film[v] = [];
    for (const t of FILM) {
      await until(origin, t);
      const t0 = Date.now(), buf = await page.screenshot({ clip }), t1 = Date.now();
      took.push(t1 - t0);
      film[v].push({ t: (t0 + t1) / 2 - origin, url: 'data:image/png;base64,' + buf.toString('base64') });
    }
    await done(before);
    for (const run of ['1', '2', '3']) { ({ before } = await start(v, run)); await done(before); }
    ({ origin, before } = await start(v, 'i'));
    await until(origin, 1900);
    const box = await frame.locator('#fav-1').boundingBox();
    await until(origin, 2300);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await done(before);
  }
  // run 参数里带了序号，按“f／1／2／3／i”归类
  await page.evaluate(() => window.__pp.RES.forEach(s => { s.run = s.run.split('&')[0]; }));
  await page.evaluate(film => window.__pp.renderAll(film), film);
  const out = await page.evaluate(() => window.__pp.RES.map(s => [s.v, s.run, Math.round(s.fcp), Math.round(s.lcp), s.lcpEl, s.cls.toFixed(3), s.longtasks.map(x => Math.round(x.d)).join('+'), s.inp && Math.round(s.inp), s.inpDelay && Math.round(s.inpDelay), s.feedback && Math.round(s.feedback), s.longtasks.map(x => Math.round(x.t)).join("+"), s.unsupported.join(',')].join(' ')));
  console.log('截图耗时 ' + took.join(' ') + '\n' + out.join('\n'));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
