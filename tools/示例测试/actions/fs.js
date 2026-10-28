// 16-10：用 CDP 发出真实的笔与触摸事件，跑一轮已知答案的演练（参与者 P03，四块）
// 每块第 4、11 次先故意按偏，第 7 次按中后再按一下，第 13 次按住笔时放下手掌；练习第 1 次按偏
const PLAN = { session: '演练', pid: 'P03', misses: [4, 11], retaps: [7], palm: [13], practiceMiss: [1] };
const MANUAL = { device: '无头 Chromium（演练，无真实屏幕）', os: '容器内 Linux', protector: '不适用（演练）', tool: 'CDP 模拟笔事件', grip: '不适用（演练）', room: '不适用（演练）', volume: '不适用（无输出设备）', vib: '不适用（无马达）', host: '测试脚本' };

module.exports = async page => {
  const c = await page.context().newCDPSession(page);
  await page.evaluate(p => { window.__plan = p; }, PLAN);
  await page.selectOption('#pid', PLAN.pid);
  for (const [k, v] of Object.entries(MANUAL)) await page.fill('#m-' + k, v);
  const pen = (type, x, y, extra = {}) => c.send('Input.dispatchMouseEvent', { type, x, y, pointerType: 'pen', ...extra });
  let px = 300, py = 700;
  for (let b = 0; b < 4; b++) {
    await page.click('#start');
    for (let t = 0; t < 18; t++) {
      await page.waitForFunction(i => { const s = window.__fs.cur(); return s.state === 'running' && s.trial === i && s.ready; }, t, { timeout: 10000 });
      const s = await page.evaluate(() => window.__fs.cur());
      const formal = t - 1, tilt = { tiltX: 14 + (t % 5) * 3, tiltY: -6 - (t % 3) * 4 }, force = 0.42 + (t % 4) * 0.09;
      const press = async (x, y) => {
        await pen('mousePressed', x, y, { button: 'left', buttons: 1, clickCount: 1, force, ...tilt });
      };
      const release = (x, y) => pen('mouseReleased', x, y, { button: 'left', buttons: 0, clickCount: 1, force: 0, ...tilt });
      for (let k = 1; k <= 5; k++) await pen('mouseMoved', px + (s.x - px) * k / 5, py + (s.y - py) * k / 5, { force: 0, ...tilt });
      const miss = t < 2 ? PLAN.practiceMiss.includes(t + 1) : PLAN.misses.includes(formal);
      if (miss) {
        const dx = s.x < s.cx ? 1 : -1, mx = s.x + dx * s.r * 1.8;
        await press(mx, s.y); await release(mx, s.y);
        await page.waitForTimeout(60);
      }
      const hx = s.x + ((t % 3) - 1) * s.r * 0.3, hy = s.y;
      await press(hx, hy);
      if (t >= 2 && PLAN.palm.includes(formal)) {
        const sx = s.x < s.cx ? 1 : -1, sy = s.y < s.cy ? 1 : -1;
        await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: hx + sx * 70, y: hy + sy * 60, radiusX: 15, radiusY: 15, force: 1, id: 9 }] });
        await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await pen('mouseMoved', hx + 1.5, hy + 1, { button: 'left', buttons: 1, force: force + 0.05, ...tilt });
      await release(hx + 1.5, hy + 1);
      if (t >= 2 && PLAN.retaps.includes(formal)) {
        await page.waitForTimeout(90);
        await press(hx, hy); await release(hx, hy);
      }
      px = hx; py = hy;
    }
    await page.waitForFunction(() => ['blockdone', 'alldone'].includes(window.__fs.cur().state), null, { timeout: 10000 });
  }
  await page.waitForFunction(() => window.__fs16, null, { timeout: 10000 });
  console.log(JSON.stringify(await page.evaluate(() => window.__fs16)));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
