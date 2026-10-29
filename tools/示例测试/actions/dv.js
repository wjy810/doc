// 21-10 项目 09：暂停、重置、缩放、输入缺失、减少动态效果；完成版里比较着色器与逐像素计算
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, ev = (f, a) => page.evaluate(f, a), sleep = ms => page.waitForTimeout(ms);
  const go = async (v, extra = '', w = 1180) => { await page.setViewportSize({ width: w, height: 900 }); await page.goto(base + '?v=' + v.toLowerCase() + extra); await sleep(700); };
  for (const v of ['A', 'B']) {
    const r = {};
    await go(v);
    await page.click('#play'); await sleep(100);
    const f0 = await ev(() => window.__dv.frames()); await sleep(1000); const f1 = await ev(() => window.__dv.frames());
    r.pause = { ok: f1 - f0 === 0, text: `${f1 - f0} 帧${f1 - f0 ? '（画面没变，却一直在重画）' : ''}` };
    const before = await ev(() => window.__dv.P.prog);
    await page.click('#reset'); await sleep(100);
    const after = await ev(() => window.__dv.P.prog), h1 = await ev(() => window.__dv.hashCanvas()), h2 = await ev(() => { window.__dv.P.prog = 0; window.__dv.draw(); return window.__dv.hashCanvas(); });
    r.reset = { ok: after === 0 && h1 === h2, text: `进度 ${before.toFixed(2)} → ${after.toFixed(2)}；画面${h1 === h2 ? '回到完整图片' : '没有变化（只是滑块回到 0）'}` };
    await go(v, '', 600);
    const s = await ev(() => window.__dv.size()), dist = (s.bw / s.bh) / (s.cw / s.ch);
    r.resize = { ok: Math.abs(dist - 1) < 0.02, text: `绘图缓冲 ${s.bw} × ${s.bh}，显示 ${s.cw} × ${s.ch}；${Math.abs(dist - 1) < 0.02 ? '比例一致' : '横向拉伸到 ' + (1 / dist).toFixed(2) + ' 倍'}` };
    await go(v, '&img=missing');
    const c = await ev(() => window.__dv.centerPixel()), m = await ev(() => window.__dv.msg());
    r.missing = { ok: !!m && c.some(x => x > 60), text: m ? `占位图案，并提示“${m}”` : `画面是黑色（中心像素 ${c.join(', ')}），没有提示` };
    await page.emulateMedia({ reducedMotion: 'reduce' }); await go(v);
    const g0 = await ev(() => window.__dv.frames()); await sleep(1000); const g1 = await ev(() => window.__dv.frames()), m2 = await ev(() => window.__dv.msg());
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    r.reduced = { ok: g1 - g0 === 0 && !!m2, text: g1 - g0 ? `照常自动播放（1 秒 ${g1 - g0} 帧）` : '不自动播放，显示静止画面与说明' };
    R[v] = r;
  }
  await go('B');
  const perf = await ev(() => { const d = window.__dv, cpu = [0, 1, 2].map(() => d.cpuFrame(512, 320, 0.3)).reduce((a, b) => a + b) / 3; return { w: 512, h: 320, cpu, gpu: 0 }; });
  await page.setViewportSize({ width: 1180, height: 900 }); await page.goto(base + '?v=b'); await sleep(400);
  perf.gpu = await ev(() => { window.__dv.P.playing = false; const s = window.__dv.size(); return window.__dv.gpuFrame(20); });
  perf.w = (await ev(() => window.__dv.size())).bw; perf.h = (await ev(() => window.__dv.size())).bh;
  await ev(() => { window.__dv.P.prog = 0.42; window.__dv.draw(); document.getElementById('prog').value = 0.42; document.getElementById('play').textContent = '播放'; });
  await ev(([R, perf]) => window.__dv.report(R, perf), [R, perf]);
  console.log(JSON.stringify(R)); console.log(JSON.stringify(perf));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
  if (process.env.H) { await page.setViewportSize({ width: 1180, height: +process.env.H }); await sleep(300); await ev(() => { window.__dv.P.prog = 0.42; window.__dv.draw(); }); }
};
