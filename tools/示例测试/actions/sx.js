// 19-09 滚动拆解：资源失败、往返一致、快速滚动、跳转章节、说明位置、窗口变化、减少动态效果、触屏滚动
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), R = { A: {}, B: {} };
  const over = async v => { const b = await page.locator('#s' + v).boundingBox(); await page.mouse.move(b.x + b.width * 0.75, b.y + 150); return b; };
  const wheel = async (dy, n) => { for (let i = 0; i < n; i++) { await page.mouse.wheel(0, dy); await sleep(40); } await sleep(150); };
  const remount = v => ev(v => __sx.mount(v), v);
  // 1 模型下载失败
  for (const v of ['A', 'B']) { await ev(v => __sx.mount(v, { fail: true }), v); R[v].fail = await ev(v => ({ text: __sx.visibleText(v), fallback: !!document.querySelector('#s' + v + ' .fallback') }), v); }
  for (const v of ['A', 'B']) await ev(([v, u]) => __sx.shot(`<figure><img src="${u}" width="270" alt="${v} 模型失败时"><figcaption>${v}：模型下载失败时</figcaption></figure>`), [v, 'data:image/png;base64,' + (await page.locator('#w' + v).screenshot()).toString('base64')]);
  for (const v of ['A', 'B']) await remount(v);
  await sleep(300);
  for (const v of ['A', 'B']) {
    // 2 往下滚 600 再往上滚 300：停在 300 时画面应与“直接滚到 300”相同
    await over(v); await wheel(100, 6); await wheel(-100, 3);
    R[v].round = await ev(v => ({ top: document.getElementById('s' + v).scrollTop, err: __sx.stateError(v) }), v);
    // 3 快速滚动：一次滚 1200
    await remount(v); await sleep(200); await over(v); await page.mouse.wheel(0, 1200); await sleep(300);
    R[v].fast = await ev(v => ({ top: document.getElementById('s' + v).scrollTop, err: __sx.stateError(v), cur: document.querySelector('#w' + v + ' [aria-current=step]')?.textContent }), v);
    // 4 跳转章节：点“底座”
    await remount(v); await sleep(200); await page.locator(`#w${v} .nav [data-i="3"]`).click(); await sleep(900);
    R[v].nav = await ev(v => ({ top: document.getElementById('s' + v).scrollTop, err: __sx.stateError(v), focus: (document.activeElement.closest('.ch') ? '章节标题“' : '导航按钮“') + (document.activeElement.textContent || document.activeElement.tagName).slice(0, 8) + '”', inCh: !!document.activeElement.closest('.ch'), cur: document.querySelector('#w' + v + ' [aria-current=step]')?.textContent }), v);
    // 5 说明位置：停在“灯罩”一章
    await remount(v); await sleep(200); await over(v); await wheel(80, 4); await sleep(200);
    R[v].label = await ev(v => __sx.S[v].label, v);
    R[v].shot = 'data:image/png;base64,' + (await page.locator('#w' + v).screenshot()).toString('base64');
    // 6 窗口变化：容器从 550 变成 420 像素宽
    await ev(v => { document.getElementById('w' + v).style.width = '420px'; }, v); await sleep(300); await ev(v => __sx.frames(3), v);
    R[v].resize = await ev(v => __sx.aspect(v), v);
    await ev(v => { document.getElementById('w' + v).style.width = ''; }, v); await sleep(200);
  }
  // 7 减少动态效果：滚到第 0 章与第 2 章，镜头角度是否变化
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const v of ['A', 'B']) {
    await remount(v); await sleep(200); const yaw = () => ev(v => { const c = __sx.S[v].cam.position; return Math.atan2(c.x, c.z) * 180 / Math.PI; }, v);
    const y0 = await yaw(); await over(v); await wheel(160, 4); const y1 = await yaw();
    R[v].motion = { y0, y1 };
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  // 8 触屏滚动：用 CDP 合成一次手指上滑
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  for (const v of ['A', 'B']) {
    await remount(v); await sleep(200); const b = await page.locator('#s' + v).boundingBox();
    const x = Math.round(b.x + b.width * 0.75), y0 = Math.round(b.y + 280);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
    for (let i = 1; i <= 15; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - i * 16 }] }); await sleep(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(300); R[v].touch = await ev(v => ({ top: document.getElementById('s' + v).scrollTop, err: __sx.stateError(v) }), v);
  }
  // 截图用：停在“灯罩”一章
  for (const v of ['A', 'B']) { await remount(v); await sleep(200); await over(v); await wheel(80, 4); }
  await page.mouse.move(5, 5);
  console.log(JSON.stringify(R, (k, x) => typeof x === 'string' && x.startsWith('data:') ? '…' : typeof x === 'number' ? +x.toFixed(2) : x));
  await ev(R => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`, e = x => x < 0.01 ? '画面与进度一致' : `部件位置差 ${x.toFixed(2)}`;
    const rows = [
      ['模型下载失败', v => c(R[v].fail.text > 0, R[v].fail.text ? `文字 ${R[v].fail.text} 字${R[v].fail.fallback ? '，有示意图和“重新加载”' : ''}` : '整个故事空白')],
      ['往下滚 600 再往上滚 300', v => c(R[v].round.err < 0.01, `停在 ${Math.round(R[v].round.top)}：${e(R[v].round.err)}`)],
      ['一次快速滚动 1200', v => c(R[v].fast.err < 0.01, `停在 ${Math.round(R[v].fast.top)}（${R[v].fast.cur}）：${e(R[v].fast.err)}`)],
      ['点章节导航“底座”', v => c(R[v].nav.err < 0.01 && R[v].nav.inCh, `停在 ${Math.round(R[v].nav.top)}：${e(R[v].nav.err)}；导航高亮“${R[v].nav.cur}”；焦点在${R[v].nav.focus}`)],
      ['“灯罩”一章的说明', v => c(R[v].label && R[v].label.dist < 12, R[v].label ? `说明指向的点离灯罩的投影中心 ${R[v].label.dist.toFixed(0)} 像素` : '没有说明')],
      ['容器从 550 缩到 420 像素', v => c(Math.abs(R[v].resize.buffer - R[v].resize.css) < 0.02, `画面比例 ${R[v].resize.buffer.toFixed(2)}，显示区域比例 ${R[v].resize.css.toFixed(2)}${Math.abs(R[v].resize.buffer - R[v].resize.css) < 0.02 ? '' : '（被压扁）'}`)],
      ['减少动态效果时滚过两章', v => c(Math.abs(R[v].motion.y1 - R[v].motion.y0) < 1, `镜头水平角 ${R[v].motion.y0.toFixed(0)}° → ${R[v].motion.y1.toFixed(0)}°`)],
      ['手指上滑 300 像素', v => c(R[v].touch.top > 100, `滚动位置 ${Math.round(R[v].touch.top)}；${R[v].touch.top > 100 ? e(R[v].touch.err) : '滚不动（只监听了滚轮）'}`)]];
    __sx.fill('res', `<tr><th>验收情况</th><th>A</th><th>B</th></tr>` + rows.map(([n, f]) => `<tr><th>${n}</th>${f('A')}${f('B')}</tr>`).join(''));
  }, R);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
