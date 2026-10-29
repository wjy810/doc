// 21-06 项目 05：对初版与完成版执行同一组动效操作，逐帧记录详情面板的位置
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, ev = (f, a) => page.evaluate(f, a);
  const fresh = async v => { await page.goto(base + (v === 'A' ? '?v=a' : '?v=b')); await page.waitForTimeout(150); };
  const cdp = await page.context().newCDPSession(page);
  const center = async sel => { const b = await page.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y })) });
  const maxJump = (rec, t0, t1) => { let m = 0; for (let i = 1; i < rec.length; i++) { const a = rec[i - 1], b = rec[i]; if (a.hidden || b.hidden || b.t < t0 || b.t > t1) continue; m = Math.max(m, Math.abs(b.x - a.x), Math.abs(b.y - a.y), Math.abs(b.w - a.w), Math.abs(b.h - a.h)); } return m; };
  for (const v of ['A', 'B']) {
    const r = {};
    // 1 快速切换（最后一次是打开）
    await fresh(v);
    for (let i = 0; i < 9; i++) { await ev(i => i % 2 ? window.__mf.back() : window.__mf.open(1), i); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    let s = await ev(() => window.__mf.state()), vis = await ev(() => window.__mf.visual());
    const match = s.view === 'list' ? vis.hidden : vis.shown;
    r.rapid = { ok: match, text: `状态是“${s.view === 'list' ? '列表' : '详情'}”，画面${vis.shown ? '显示详情' : vis.hidden ? '显示列表' : '停在中间'}${match ? '' : '（不一致）'}` };
    // 2 打开途中返回
    await fresh(v); await ev(() => window.__mf.rec(true));
    await page.click('.card >> nth=0'); await page.waitForTimeout(150);
    const tBack = await ev(() => { window.__mf.back(); return performance.now(); });
    await page.waitForTimeout(600); let rec = await ev(() => window.__mf.rec(false));
    const jRev = maxJump(rec, tBack - 1, tBack + 40), jAll = maxJump(rec, 0, tBack - 1);
    r.reverse = { ok: jRev <= jAll * 1.2 + 1, text: `${jRev.toFixed(0)} 像素（正常展开时每帧最多 ${jAll.toFixed(0)} 像素）` };
    // 3 内容变长后返回
    await fresh(v); await page.click('.card >> nth=2'); await page.waitForTimeout(500);
    await page.click('[data-act="edit"]'); await page.fill('#eTitle', '读书笔记：先处理数据关系，再设计交互状态（第三章，含两个例子）'); await page.click('[data-act="save"]'); await page.waitForTimeout(700);
    await ev(() => window.__mf.rec(true)); await page.click('[data-act="back"]'); await page.waitForTimeout(600); rec = await ev(() => window.__mf.rec(false));
    const last = rec.filter(f => !f.hidden).pop(), card = await ev(() => window.__mf.cardRect(3));
    const diff = Math.max(Math.abs(last.y - card.y), Math.abs(last.h - card.h), Math.abs(last.x - card.x), Math.abs(last.w - card.w));
    r.content = { ok: diff <= 2, text: `${diff.toFixed(0)} 像素${diff > 2 ? '（收回后卡片突然变高）' : ''}` };
    // 4 触屏：点开后右滑
    await fresh(v); await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
    let [x, y] = await center('.card >> nth=0'); await touch('touchStart', [[x, y]]); await touch('touchEnd', []); await page.waitForTimeout(600);
    const opened = (await ev(() => window.__mf.state())).view !== 'list';
    await touch('touchStart', [[60, 300]]); for (let i = 1; i <= 8; i++) await touch('touchMove', [[60 + i * 20, 300]]); await touch('touchEnd', []); await page.waitForTimeout(700);
    s = await ev(() => window.__mf.state()); vis = await ev(() => window.__mf.visual());
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    r.touch = { ok: opened && s.view === 'list' && vis.hidden, text: `${opened ? '点开成功' : '没有打开'}；右滑后${s.view === 'list' ? '回到列表' : '仍在详情（没有手势）'}` };
    // 5 减少动态效果
    await page.emulateMedia({ reducedMotion: 'reduce' }); await fresh(v); await page.click('.card >> nth=0'); await page.waitForTimeout(30);
    const n = await ev(() => window.__mf.anims()); await page.emulateMedia({ reducedMotion: 'no-preference' });
    r.reduced = { ok: n === 0, text: n ? `仍有 ${n} 个动画在运行` : '没有动画，直接切换' };
    // 6 键盘
    await fresh(v); await page.focus('.card >> nth=0'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
    s = await ev(() => window.__mf.state()); vis = await ev(() => window.__mf.visual());
    r.keyboard = { ok: s.view === 'detail' && vis.shown, text: s.view === 'detail' && vis.shown ? '打开详情' : '没有打开' };
    R[v] = r;
  }
  // 胶片：完成版打开动画在 0、80、160、240、320 毫秒的画面
  if (process.env.SHOTS) {
    await fresh('B'); await page.click('.card >> nth=1');
    await ev(() => document.getAnimations()[0].pause());
    for (const t of [0, 80, 160, 240, 320]) { await ev(t => { document.getAnimations()[0].currentTime = t; }, t); await page.locator('#phone').screenshot({ path: `${process.env.SHOTS}/mf-${t}.png` }); }
  }
  await fresh('B'); await ev(R => window.__mf.report(R), R);
  console.log(JSON.stringify(R));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
