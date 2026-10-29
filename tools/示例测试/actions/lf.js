// 19-12 从效果库学习：空闲时的动画循环、偏移幅度、键盘焦点、减少动态效果、触屏
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), R = { orig: {}, ours: {} };
  const sel = { orig: '.mag-orig', ours: '.mag' };
  const off = k => ev(k => { const p = __lf.pos[k](); return Math.hypot(p.x, p.y); }, k);
  // 1 空闲 1 秒：指针不在附近
  await page.mouse.move(5, 5); await sleep(600); await ev(() => { __lf.LOOP.orig = 0; __lf.LOOP.ours = 0; }); await sleep(1000);
  const idle = await ev(() => ({ ...__lf.LOOP })); R.orig.idle = idle.orig; R.ours.idle = idle.ours;
  // 2 指针停在按钮中心右侧 70 像素
  for (const k of ['orig', 'ours']) { const b = await page.locator(sel[k]).boundingBox(); await page.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2, { steps: 4 }); await page.mouse.move(b.x + b.width / 2 + 70, b.y + b.height / 2, { steps: 4 }); await sleep(700); R[k].near = await off(k); }
  await page.mouse.move(5, 5); await sleep(700);
  // 3 键盘：按 Tab 到按钮上，看有没有焦点框
  for (const k of ['orig', 'ours']) { let n = 0; while (n++ < 10) { await page.keyboard.press('Tab'); if (await ev(s => document.activeElement.matches(s), sel[k])) break; } R[k].focus = await ev(s => { const c = getComputedStyle(document.activeElement); return document.activeElement.matches(s) ? (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0 ? c.outlineWidth + ' ' + c.outlineStyle : '没有焦点框') : '到不了'; }, sel[k]); }
  await ev(() => document.activeElement.blur());
  // 4 减少动态效果
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const k of ['orig', 'ours']) { const b = await page.locator(sel[k]).boundingBox(); await page.mouse.move(b.x + b.width / 2 + 40, b.y + b.height / 2, { steps: 4 }); await page.mouse.move(b.x + b.width / 2 + 70, b.y + b.height / 2, { steps: 4 }); await sleep(700); R[k].reduce = await off(k); }
  await page.mouse.move(5, 5); await sleep(700); await page.emulateMedia({ reducedMotion: 'no-preference' });
  // 5 触屏：手指在按钮旁边滑一下再抬起
  const cdp = await page.context().newCDPSession(page); await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  for (const k of ['orig', 'ours']) {
    const b = await page.locator(sel[k]).boundingBox(), x = Math.round(b.x + b.width / 2 + 60), y = Math.round(b.y + b.height / 2 + 20);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 5; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 4, y }] }); await sleep(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(800);
    R[k].touch = await off(k);
  }
  console.log(JSON.stringify(R));
  await ev(R => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`, px = x => x.toFixed(1) + ' 像素';
    __lf.fill('tA', `<tr><th>情况</th><th>原样拷贝</th><th>改造后</th></tr>`
      + `<tr><th>指针不在附近，1 秒内的动画帧回调</th>${c(R.orig.idle < 5, R.orig.idle + ' 次（循环一直在跑）')}${c(R.ours.idle < 5, R.ours.idle + ' 次（停稳后结束）')}</tr>`
      + `<tr><th>指针停在按钮右侧 70 像素</th>${c(R.orig.near <= 8.5, '偏移 ' + px(R.orig.near) + '，按钮跑开了')}${c(R.ours.near <= 8.5, '偏移 ' + px(R.ours.near) + '（上限 8 像素）')}</tr>`
      + `<tr><th>按 Tab 到按钮</th>${c(!/没有|到不了/.test(R.orig.focus), R.orig.focus)}${c(!/没有|到不了/.test(R.ours.focus), '焦点框 ' + R.ours.focus)}</tr>`
      + `<tr><th>减少动态效果时同样停在右侧</th>${c(R.orig.reduce < 0.5, '偏移 ' + px(R.orig.reduce))}${c(R.ours.reduce < 0.5, '偏移 ' + px(R.ours.reduce))}</tr>`
      + `<tr><th>触屏：手指在旁边滑过后抬起</th>${c(R.orig.touch < 0.5, '偏移 ' + px(R.orig.touch) + (R.orig.touch >= 0.5 ? '，停在偏开的位置' : ''))}${c(R.ours.touch < 0.5, '偏移 ' + px(R.ours.touch))}</tr>`);
  }, R);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
