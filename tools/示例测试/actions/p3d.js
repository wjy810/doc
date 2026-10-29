// 21-09 项目 08：加载、失败、静止重画、像素、触屏、视角、标注与窄屏（以设备像素比 2 运行）
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, P = {}, ev = (f, a) => page.evaluate(f, a), sleep = ms => page.waitForTimeout(ms);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  const go = async (v, extra = '') => { await page.setViewportSize({ width: 1180, height: 900 }); await page.goto(base + '?v=' + v.toLowerCase() + extra); };
  for (const v of ['A', 'B']) {
    const r = {}, p = {};
    await go(v); await sleep(300);
    const txt = await ev(() => document.getElementById('info').innerText + document.getElementById('poster').innerText);
    r.early = { ok: /尺寸/.test(txt) && /充电口/.test(txt), text: txt.trim() ? `规格、部件说明与加载提示（${txt.replace(/\s/g, '').length} 字）` : '什么也没有（只有空白画布）' };
    await page.waitForFunction(() => window.__p3?.ready(), null, { timeout: 8000 }); await sleep(200);
    p.ready = await ev(() => window.__p3.PERF.modelReady); p.firstText = await ev(() => window.__p3.PERF.firstText);
    const f0 = await ev(() => window.__p3.frames()); await sleep(2000); const idle = (await ev(() => window.__p3.frames())) - f0;
    r.idle = { ok: idle < 5, text: `${idle} 帧` };
    const px = await ev(() => ({ px: window.__p3.pixels(), css: document.getElementById('cv').clientWidth * document.getElementById('cv').clientHeight, dpr: window.__p3.dpr }));
    r.pixels = { ok: px.dpr <= 1.5, text: `${px.px.toLocaleString()}（CSS 像素的 ${(px.px / px.css).toFixed(2)} 倍）` };
    p.dpr = px.dpr; p.idle = idle;
    // 视角与恢复
    if (v === 'B') { await page.click('[data-view="top"]'); const top = await ev(() => window.__p3.view()); await page.click('[data-view="reset"]'); const rs = await ev(() => window.__p3.view()); r.views = { ok: top.polar < 15 && Math.abs(rs.polar - 70) < 1 && Math.abs(rs.az - 30) < 1, text: `顶部：俯仰 ${top.polar.toFixed(0)}°；恢复：方位 ${rs.az.toFixed(0)}°、俯仰 ${rs.polar.toFixed(0)}°` }; }
    else r.views = { ok: false, text: '没有视角按钮，也不能恢复默认' };
    // 转到背面看标注
    const b = await page.locator('#cv').boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + b.height / 2, cy, { steps: 10 }); await page.mouse.up(); await sleep(100);
    const back = await ev(() => window.__p3.backLabelsShown()), az = (await ev(() => window.__p3.view())).az;
    r.labels = { ok: back.length === 0, text: back.length ? `方位 ${az.toFixed(0)}° 时仍标注：${back.join('、')}（标签浮在背面部件上）` : `方位 ${az.toFixed(0)}° 时没有（只标注朝向相机的部件）` };
    // 触屏：页面变矮以便滚动
    await page.setViewportSize({ width: 1180, height: 420 }); await ev(() => window.scrollTo(0, 0)); await sleep(200);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    const b2 = await page.locator('#cv').boundingBox(), tx = b2.x + b2.width / 2, ty = Math.min(b2.y + b2.height - 20, 380);
    const az0 = (await ev(() => window.__p3.view())).az;
    await touch('touchStart', [[tx, ty]]); for (let i = 1; i <= 10; i++) await touch('touchMove', [[tx, ty - i * 20]]); await touch('touchEnd', []); await sleep(400);
    const sy = await ev(() => scrollY);
    r.touchScroll = { ok: sy > 50, text: sy > 50 ? `页面滚动了 ${Math.round(sy)} 像素` : `页面没有滚动（手指被三维区域“困住”）` };
    await ev(() => window.scrollTo(0, 0)); await sleep(200);
    const b3 = await page.locator('#cv').boundingBox(), hx = b3.x + 200, hy = Math.min(b3.y + b3.height / 2, 300), az1 = (await ev(() => window.__p3.view())).az;
    await touch('touchStart', [[hx, hy]]); for (let i = 1; i <= 10; i++) await touch('touchMove', [[hx + i * 15, hy + i]]); await touch('touchEnd', []); await sleep(300);
    const az2 = (await ev(() => window.__p3.view())).az, dAz = Math.abs(((az2 - az1 + 540) % 360) - 180);
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    r.touchRotate = { ok: dAz > 10, text: `旋转了 ${dAz.toFixed(0)}°` };
    // 窄屏
    await page.setViewportSize({ width: 375, height: 800 }); await sleep(400);
    const fit = await ev(() => window.__p3.fit()), list = await ev(() => !!document.getElementById('partList')), ov = await ev(() => window.__p3.overlaps());
    r.narrow = { ok: fit <= 0.95 && ov.n === 0 && list, text: `画面上 ${ov.shown} 个标注，${ov.n} 对互相重叠；${list ? '改用下方的部件列表' : '没有文字说明'}；产品占画面 ${(fit * 100).toFixed(0)}%` };
    // 加载失败
    await go(v, '&fail=model'); await sleep(2200);
    const ft = await ev(() => document.getElementById('poster').innerText.trim());
    r.fail = { ok: /没有加载成功/.test(ft), text: ft ? '显示静态图、失败原因与“重试”按钮' : '一片空白，没有任何说明' };
    R[v] = r; P[v] = p;
  }
  await go('B'); await page.waitForFunction(() => window.__p3?.ready(), null, { timeout: 8000 });
  const perf = [['首次出现可读文字', '模型加载完成后（无文字）', `${P.B.firstText.toFixed(0)} 毫秒`], ['模型可以操作', `${P.A.ready.toFixed(0)} 毫秒`, `${P.B.ready.toFixed(0)} 毫秒`], ['设备像素比 2 时的渲染像素比', `${P.A.dpr}`, `${P.B.dpr}（上限 1.5）`], ['静止 2 秒内重画', `${P.A.idle} 帧（每帧都重画）`, `${P.B.idle} 帧（只在视角变化时重画）`]];
  await ev(([R, perf]) => window.__p3.report(R, perf), [R, perf]);
  console.log(JSON.stringify(R)); console.log(JSON.stringify(perf));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
  if (process.env.H) { await page.setViewportSize({ width: 1180, height: +process.env.H }); await sleep(300); }
};
