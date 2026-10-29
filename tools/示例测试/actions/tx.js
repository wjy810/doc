// 19-06 文字与图像特效：无障碍树与选择、读回像素测比例、帧时间、粒子误差、闪烁次数
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), R = { A: {}, B: {} };
  await sleep(1000);
  // 1 动态文字
  for (const v of ['A', 'B']) {
    const snap = await page.locator('#k' + v).ariaSnapshot();
    const sel = await ev(v => { const el = document.getElementById('k' + v), r = document.createRange(); r.selectNodeContents(el); const s = getSelection(); s.removeAllRanges(); s.addRange(r); const t = s.toString().replace(/\s/g, ''); s.removeAllRanges(); return t; }, v);
    R[v].kin = { snap: snap.replace(/\s+/g, ' ').trim(), sel };
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  R.B.kin.reduce = await ev(() => document.getElementById('kB').getAnimations({ subtree: true }).filter(a => a.playState === 'running').length);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  R.A.kin.reduce = '一直在晃';
  // 2 液态扭曲
  for (const v of ['A', 'B']) { R[v].warp = await ev(v => ({ aspect: __tx.circleAspect(v) }), v); R[v].warp.cost = await ev(v => __tx.warpCost(v, 1000), v); await ev(v => __tx.W[v].draw(1.2, 0.08), v); }
  // 3 粒子：推开后 2 秒，再来一次 0.5 秒的时间间隔
  for (const v of ['A', 'B']) {
    const n = await ev(v => __tx.P[v].pts.length, v);
    await ev(v => { const c = __tx.P[v].cv; __tx.push(v, c.width / 2, c.height / 2); }, v);
    const run = await ev(v => __tx.runParticles(v, 2000), v);
    const settle = (() => { let t = null; for (const [ms, e] of run.trace) { if (e < 1 && t === null) t = ms; if (e >= 1) t = null; } return t; })();
    const e2 = run.trace[run.trace.length - 1][1], peak = Math.max(...run.trace.map(x => x[1]));
    await ev(v => __tx.stepParticles(v, 0.5), v);
    const after = await ev(v => __tx.runParticles(v, 600), v);
    R[v].part = { n, p50: run.p50, settle, e2, peak, spike: Math.max(...after.trace.map(x => x[1])), end: after.trace[after.trace.length - 1][1] };
  }
  // 4 闪电：指针来回划 1 秒
  for (const v of ['A', 'B']) {
    const b = await page.locator('#z' + v).boundingBox();
    await page.mouse.move(b.x + 20, b.y + 100);
    await ev(v => __tx.startRec(v), v);
    for (let i = 0; i < 5; i++) { await page.mouse.move(b.x + b.width - 20, b.y + 60 + i * 10, { steps: 10 }); await page.mouse.move(b.x + 20, b.y + 100 - i * 10, { steps: 10 }); }
    await sleep(200); R[v].zap = await ev(v => __tx.stopRec(v), v);
    if (v === 'B') { await page.locator('#zB .toggle').click(); await ev(() => __tx.startRec('B')); for (let i = 0; i < 2; i++) { await page.mouse.move(b.x + b.width - 20, b.y + 80, { steps: 20 }); await page.mouse.move(b.x + 20, b.y + 90, { steps: 20 }); } await sleep(200); R.B.zapOff = await ev(() => __tx.stopRec('B')); await page.locator('#zB .toggle').click(); }
  }
  // 截图前在闪电上留一道
  for (const v of ['A', 'B']) { const b = await page.locator('#z' + v).boundingBox(); await page.mouse.move(b.x + 40, b.y + 120); await page.mouse.move(b.x + 200, b.y + 110, { steps: 3 }); }
  await page.mouse.move(5, 5);
  console.log(JSON.stringify(R, (k, x) => typeof x === 'number' ? +x.toFixed(2) : x));
  await ev(R => {
    const c = (ok, t) => `<td class="num ${ok ? 'good' : 'poor'}">${t}</td>`, f = n => n.toFixed(1);
    __tx.fill('tK', `<tr><th></th><th>无障碍树里的标题</th><th>选中复制得到</th><th>减少动态效果时</th></tr>` + ['A', 'B'].map(v => { const k = R[v].kin; return `<tr><th>${v}</th>${c(/听见城市/.test(k.snap), /听见城市/.test(k.snap) ? '“听见城市”' : '没有文字')}${c(k.sel === '听见城市', k.sel ? '“' + k.sel + '”' : '（空）')}${c(v === 'B' && !k.reduce, v === 'B' ? (k.reduce ? k.reduce + ' 个动画仍在播' : '不播放动画') : '一直在晃')}</tr>`; }).join(''));
    __tx.fill('tW', `<tr><th></th><th>原图里的正圆，显示的宽高比</th><th>每帧着色的像素</th><th>帧时间（中位／第 95 百分位）</th></tr>` + ['A', 'B'].map(v => { const w = R[v].warp; return `<tr><th>${v}</th>${c(Math.abs(w.aspect - 1) < 0.05, w.aspect.toFixed(2) + (Math.abs(w.aspect - 1) < 0.05 ? '' : '（被拉宽）'))}<td class="num">${(w.cost.px / 1000).toFixed(0)} 千</td>${c(w.cost.p95 <= 20, f(w.cost.p50) + '／' + f(w.cost.p95) + ' 毫秒')}</tr>`; }).join(''));
    __tx.fill('tP', `<tr><th></th><th>粒子数</th><th>帧时间中位数</th><th>推开后多久回到 1 像素内</th><th>2 秒时的平均误差</th><th>0.5 秒间隔后的最大误差</th></tr>` + ['A', 'B'].map(v => { const p = R[v].part; return `<tr><th>${v}</th><td class="num">${p.n}</td><td class="num">${f(p.p50)} 毫秒</td>${c(p.settle !== null, p.settle === null ? '2 秒内没有稳定' : (p.settle / 1000).toFixed(2) + ' 秒')}${c(p.e2 < 1, f(p.e2) + ' 像素')}${c(p.spike < 20, p.spike > 1000 ? '飞散（' + p.spike.toExponential(1) + ' 像素）' : f(p.spike) + ' 像素')}</tr>`; }).join(''));
    __tx.fill('tZ', `<tr><th></th><th>指针来回划动时的整体闪烁</th><th>画面平均亮度最高</th><th>关闭后</th></tr>` + ['A', 'B'].map(v => { const z = R[v].zap; return `<tr><th>${v}</th>${c(z.perSec <= 3, z.flashes + ' 次（' + z.sec.toFixed(1) + ' 秒）；任意 1 秒内最多 ' + z.perSec + ' 次' + (z.perSec > 3 ? '，超过 3 次' : ''))}<td class="num">${(z.max * 100).toFixed(0)}%</td>${c(v === 'B', v === 'B' ? R.B.zapOff.flashes + ' 次，不画闪电' : '不能关闭')}</tr>`; }).join(''));
  }, R);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
