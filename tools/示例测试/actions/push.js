// PUSH_MODE：shot（划过后截图）、perf（图片尺寸与性能）、life（隐藏、窗口变化、销毁）、field（显示扰动场截图）
module.exports = async page => {
  const mode = process.env.PUSH_MODE || 'shot';
  const box = await page.locator('#stage').boundingBox();
  const swipe = async (y0, y1, steps = 14) => {
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * y0);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) { await page.mouse.move(box.x + box.width * (0.2 + 0.6 * i / steps), box.y + box.height * (y0 + (y1 - y0) * i / steps)); await page.waitForTimeout(16); }
    await page.mouse.up();
  };
  if (mode === 'shot' || mode === 'field') {
    if (mode === 'field') await page.check('#field');
    await page.evaluate(() => window.__push.stop());           // 用固定步长推进，截图可以复现
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.45);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(box.x + box.width * (0.2 + 0.05 * i), box.y + box.height * (0.45 + 0.01 * i));
      await page.evaluate(() => window.__push.step(1 / 60));
    }
    await page.mouse.up();
    await page.evaluate(() => { for (let i = 0; i < 4; i++) window.__push.step(1 / 60); });
  }
  if (mode === 'perf') {
    for (const s of [512, 1024, 2048, 4096]) { await page.click(`[data-size="${s}"]`); await page.waitForTimeout(300); }
    console.log(await page.$$eval('#perf tr', rows => rows.map(r => r.textContent.replace(/\s+/g, ' ')).join(' | ')));
  }
  if (mode === 'life') {
    // 1. 连续快速划动 5 次：位移不应无限增大
    for (let k = 0; k < 5; k++) await swipe(0.3 + k * 0.08, 0.5);
    await page.waitForTimeout(200);
    const maxD = await page.evaluate(() => { const r = window.__push.renderer; return r.info.render.frame; });
    console.log('frames rendered:', maxD, 'running:', await page.evaluate(() => window.__push.running));
    // 2. 页面隐藏：循环停止；恢复后继续
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    console.log('hidden → running:', await page.evaluate(() => window.__push.running));
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    console.log('visible → running:', await page.evaluate(() => window.__push.running));
    // 3. 窗口变窄：画布与扰动场跟着调整
    await page.setViewportSize({ width: 700, height: 900 }); await page.waitForTimeout(500);
    console.log('after resize canvas:', await page.evaluate(() => { const c = document.querySelector('#stage canvas'); return c.width + '×' + c.height; }));
    // 4. 触摸：用调试协议发送真实的触摸滑动
    const b2 = await page.locator('#stage').boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const pt = (x, y) => [{ x: b2.x + b2.width * x, y: b2.y + b2.height * y, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(0.3, 0.5) });
    for (let i = 1; i <= 8; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(0.3 + i * 0.05, 0.5) }); await page.waitForTimeout(16); }
    const during = await page.evaluate(() => window.__push.pointers.size);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    console.log('touch pointers during swipe:', during, 'after:', await page.evaluate(() => window.__push.pointers.size));
    // 5. 静态模式与销毁
    await page.check('#static');
    console.log('static → running:', await page.evaluate(() => window.__push.running));
    await page.click('#destroy');
    console.log('destroy:', await page.textContent('#mem'));
  }
};
