// 12-03：鼠标用 Playwright；笔和触摸用 CDP 直接向浏览器发送输入（与真实设备走同一条事件管线）
module.exports = async page => {
  const cdp = await page.context().newCDPSession(page);
  const pad = await page.locator('#pad').boundingBox();
  const P = (fx, fy) => [pad.x + fx * pad.width, pad.y + fy * pad.height];
  // 鼠标：先悬停移动，再按下拖动
  await page.mouse.move(...P(0.05, 0.3)); await page.mouse.move(...P(0.3, 0.3), { steps: 10 });
  await page.mouse.down(); await page.mouse.move(...P(0.3, 0.8), { steps: 20 }); await page.mouse.up();
  // 笔：悬停、按下（压力逐渐增大）、带倾斜拖动
  const pen = async (type, [x, y], force, tiltX, buttons = 1) => cdp.send('Input.dispatchMouseEvent', { type, x, y, pointerType: 'pen', button: type === 'mouseMoved' && !buttons ? 'none' : 'left', buttons, force, tiltX, tiltY: 10, clickCount: 1 });
  for (let i = 0; i <= 6; i++) await pen('mouseMoved', P(0.4 + i * 0.01, 0.25), 0, 0, 0);
  await pen('mousePressed', P(0.46, 0.25), 0.2, 30);
  for (let i = 1; i <= 20; i++) await pen('mouseMoved', P(0.46 + i * 0.01, 0.25 + i * 0.025), 0.2 + i * 0.035, 30 + i);
  await pen('mouseReleased', P(0.66, 0.75), 0, 50);
  // 触摸：按下、拖动、抬起（接触面半径 9 像素）
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y]) => ({ x, y, radiusX: 9, radiusY: 9, force: 1 })) });
  await touch('touchStart', [P(0.75, 0.2)]);
  for (let i = 1; i <= 20; i++) await touch('touchMove', [P(0.75 + i * 0.008, 0.2 + i * 0.03)]);
  await touch('touchEnd', []);
  await page.waitForTimeout(200);
  console.log(JSON.stringify(await page.evaluate(() => { const s = window.__renderPointers(); const o = {}; for (const k in s) o[k] = { ...s[k], buttons: [...s[k].buttons] }; return o; })));
  // 替代操作
  await page.click('[data-del="0"]'); await page.waitForTimeout(100);
  await page.focus('[data-del="1"]'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Delete'); await page.waitForTimeout(100);
  const it = await page.locator('.item[data-i="2"]').boundingBox();
  await touch('touchStart', [[it.x + 40, it.y + it.height / 2]]); await page.waitForTimeout(650); await touch('touchEnd', []);
  await page.waitForTimeout(100); await page.click('#menuDel'); await page.waitForTimeout(100);
  await page.click('#undo'); await page.waitForTimeout(100);
  await page.fill('#voice', '把那个删了'); await page.press('#voice', 'Enter'); await page.waitForTimeout(100);
  await page.fill('#voice', '删除第二条'); await page.press('#voice', 'Enter'); await page.waitForTimeout(100);
  await page.fill('#voice', '删除第三条'); await page.press('#voice', 'Enter'); await page.waitForTimeout(100);
  await page.click('#undo'); await page.waitForTimeout(100);
  const r = await page.evaluate(() => ({ alt: window.__input.altLog, left: window.__input.removed(), before: window.__input.before, after: window.__input.after, fx: window.__input.fx, m: window.__input.mres.map(m => [m.size, m.gap, m.sigma, (100 * m.miss).toFixed(1), (100 * m.wrong).toFixed(1)].join('/')) }));
  console.log(JSON.stringify(r, null, 0));
  await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
  console.log(await page.evaluate(() => [...document.querySelectorAll('#dwell tr')].map(r => r.innerText.replace(/\s+/g, ' ')).join('\n')));
};
