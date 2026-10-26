module.exports = async page => {
  const top = () => page.$eval('#deck .job:last-child h3', e => e.textContent);
  const box = await page.locator('#deck').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  // 1. 慢慢拖 60 像素后松手：距离不够、速度不快 → 弹回
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 12; i++) { await page.mouse.move(cx + i * 5, cy); await page.waitForTimeout(30); }
  await page.waitForTimeout(120); await page.mouse.up(); await page.waitForTimeout(600);
  console.log('slow drag:', await page.textContent('#log'), '| top:', await top());
  // 2. 快速甩出 90 像素 → 收藏
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 3; i++) { await page.mouse.move(cx + i * 30, cy); await page.waitForTimeout(8); }
  await page.mouse.up(); await page.waitForTimeout(500);
  console.log('fling:', await page.textContent('#log'), '| top:', await top());
  // 3. 撤销
  await page.click('#undo'); await page.waitForTimeout(200);
  console.log('undo:', await page.textContent('#log'), '| top:', await top());
  // 4. 按钮跳过（不拖动的替代方式）
  await page.click('#skip'); await page.waitForTimeout(500);
  console.log('button skip:', await page.textContent('#log'));
  // 5. 合成两根手指：距离变为 2 倍、连线转 45 度
  const t = await page.evaluate(() => {
    const v = document.getElementById('viewer'), r = v.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const fire = (type, id, x, y) => v.dispatchEvent(new PointerEvent(type, { pointerId: id, pointerType: 'touch', clientX: x, clientY: y, bubbles: true, isPrimary: id === 1 }));
    fire('pointerdown', 1, cx - 40, cy); fire('pointerdown', 2, cx + 40, cy);
    fire('pointermove', 2, cx - 40 + 80 * 2 * Math.cos(Math.PI / 4), cy + 80 * 2 * Math.sin(Math.PI / 4));
    fire('pointerup', 1, cx - 40, cy); fire('pointerup', 2, 0, 0);
    return document.getElementById('photo').style.transform;
  });
  console.log('pinch:', t);
};
