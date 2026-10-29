// 19-04 表面与光影：截图测对比度、移动背景测帧时间、真实鼠标移动测事件频率与倾斜、触屏设备模拟
const path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (fn, a) => page.evaluate(fn, a), b64 = async loc => (await loc.screenshot()).toString('base64');
  const R = { A: {}, B: {} };
  for (const v of ['A', 'B']) {
    R[v].grad = await ev(b => __sf.gradientContrast(b), await b64(page.locator(`#g${v} .gt`)));
    R[v].glass = await ev(b => __sf.glassContrast(b), await b64(page.locator(`#s${v} .blank`)));
  }
  for (const v of ['A', 'B']) R[v].cost = await ev(v => __sf.moveCost(document.getElementById('s' + v)), v);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const v of ['A', 'B']) R[v].anim = await ev(v => document.querySelector('.g' + v).getAnimations().filter(a => a.playState === 'running').length, v);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // 聚光灯：从左到右划过，120 个移动事件
  for (const v of ['A', 'B']) {
    // 真实鼠标划过：Chromium 会把移动事件对齐到每帧一次
    const b = await page.locator('#p' + v).boundingBox();
    await page.mouse.move(b.x + 10, b.y + 75); await sleep(50);
    await ev(v => { __sf.SPOT[v].events = 0; __sf.SPOT[v].writes = 0; }, v);
    await page.mouse.move(b.x + b.width - 10, b.y + 75, { steps: 60 }); await sleep(100);
    R[v].real = await ev(v => ({ ...__sf.SPOT[v] }), v);
    R[v].spot = await ev(v => __sf.spotBurst(v), v);
  }
  await page.mouse.move(5, 5);
  // 触屏手机：没有悬停
  const ctx = await page.context().browser().newContext({ viewport: { width: 1180, height: 900 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const m = await ctx.newPage();
  await m.route(/^https?:\/\//, r => r.abort());
  await m.goto(page.url()); await sleep(300);
  const hoverNone = await m.evaluate(() => matchMedia('(hover: none)').matches);
  for (const v of ['A', 'B']) {
    const s = (await m.locator('#p' + v).screenshot()).toString('base64');
    R[v].touch = { url: 'data:image/png;base64,' + s };
    const clip = (await m.locator(`#p${v} p:nth-of-type(1)`).screenshot()).toString('base64');
    R[v].touch.contrast = (await ev(b => __sf.glassContrast(b), clip)).spread;   // 区域里最亮与最暗像素之比：文字看不见时接近 1
  }
  await ctx.close();
  // 倾斜卡片：指针移到右上角
  for (const rm of ['no-preference', 'reduce']) {
    await page.emulateMedia({ reducedMotion: rm });
    for (const v of ['A', 'B']) {
      const st = await page.locator('#c' + v).boundingBox();
      await page.mouse.move(st.x + st.width / 2, st.y + st.height / 2); await page.mouse.move(st.x + 5, st.y + 75); await sleep(50);
      const before = await ev(v => { const c = document.querySelector('#c' + v + ' .card'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); return document.querySelector('#c' + v + ' h3').getBoundingClientRect().toJSON(); }, v);
      const cb = await page.locator(`#c${v} .card`).boundingBox();
      await page.mouse.move(cb.x + cb.width - 2, cb.y + 2); await sleep(80);
      const after = await ev(v => { const c = document.querySelector('#c' + v + ' .card'), h = document.querySelector('#c' + v + ' h3').getBoundingClientRect(); return { r: h.toJSON(), rx: c.style.getPropertyValue('--rx'), ry: c.style.getPropertyValue('--ry') }; }, v);
      R[v]['tilt-' + rm] = { rx: parseFloat(after.rx), ry: parseFloat(after.ry), move: Math.hypot(after.r.x - before.x, after.r.y - before.y), wide: after.r.width / before.width };
      if (rm === 'no-preference') R[v].tiltShot = 'data:image/png;base64,' + (await page.locator('#c' + v).screenshot()).toString('base64');
      await page.mouse.move(5, 5);
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  console.log(JSON.stringify(R, (k, x) => typeof x === 'string' && x.startsWith('data:') ? '…' : typeof x === 'number' ? +x.toFixed(2) : x), 'hoverNone', hoverNone);
  await ev(([R, hn]) => {
    const f = n => n.toFixed(2), c = (ok, t) => `<td class="num ${ok ? 'good' : 'poor'}">${t}</td>`;
    __sf.fill('tG', `<tr><th></th><th>最浅处对比度</th><th>中位对比度</th><th>减少动态效果时仍在播放的动画</th></tr>` + ['A', 'B'].map(v => `<tr><th>${v}</th>${c(R[v].grad.min >= 4.5, f(R[v].grad.min))}<td class="num">${f(R[v].grad.median)}</td>${c(!R[v].anim, R[v].anim + ' 个')}</tr>`).join(''));
    __sf.fill('tS', `<tr><th></th><th>白字对比度（最差／最好）</th><th>背景移动时的帧时间（中位／第 95 百分位）</th></tr>` + ['A', 'B'].map(v => `<tr><th>${v}</th>${c(R[v].glass.worst >= 4.5, f(R[v].glass.worst) + '／' + f(R[v].glass.best))}<td class="num">${R[v].cost.p50.toFixed(1)}／${R[v].cost.p95.toFixed(1)} 毫秒</td></tr>`).join(''));
    for (const v of ['A', 'B']) __sf.shot('touch', `<figure><img src="${R[v].touch.url}" width="250" alt="触屏手机上的${v}"><figcaption>触屏手机上的 ${v}</figcaption></figure>`);
    __sf.fill('tP', `<tr><th></th><th>真实鼠标划过（事件／写入）</th><th>同一帧 120 次事件：样式写入、耗时</th><th>触屏上说明文字的对比度</th></tr>` + ['A', 'B'].map(v => `<tr><th>${v}</th><td class="num">${R[v].real.events}／${R[v].real.writes}</td>${c(R[v].spot.writes <= 2, R[v].spot.writes + ' 次、' + R[v].spot.ms.toFixed(1) + ' 毫秒')}${c(R[v].touch.contrast >= 4.5, f(R[v].touch.contrast) + (R[v].touch.contrast < 1.5 ? '（看不见）' : ''))}</tr>`).join('') + `<tr><td colspan="4">Chromium 已把鼠标移动事件对齐到每帧一次，所以真实划过时两者一样；高频输入设备或其他浏览器可能在一帧里送来多次事件，A 每次都读布局、写样式。触屏模拟：(hover: none) = ${hn}。A 的说明只在光圈下面可见，触屏上没有指针，说明永远看不见。</td></tr>`);
    __sf.fill('tC', `<tr><th></th><th>指针在右上角时的角度</th><th>标题移动</th><th>减少动态效果时的角度</th></tr>` + ['A', 'B'].map(v => { const a = R[v]['tilt-no-preference'], b = R[v]['tilt-reduce']; return `<tr><th>${v}</th><td class="num">X ${a.rx.toFixed(0)}°、Y ${a.ry.toFixed(0)}°</td>${c(a.move < 10, a.move.toFixed(1) + ' 像素')}${c(!b.rx && !b.ry, `X ${b.rx.toFixed(0)}°、Y ${b.ry.toFixed(0)}°`)}</tr>`; }).join(''));
  }, [R, hoverNone]);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
