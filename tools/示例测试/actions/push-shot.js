// 先测量四种图片尺寸（填好表格），回到 1024，再用固定步长划过画面后截图；PUSH_FIELD=1 时显示扰动场
module.exports = async page => {
  for (const s of [512, 1024, 2048, 4096]) { await page.click(`[data-size="${s}"]`); await page.waitForTimeout(200); }
  await page.evaluate(() => window.__push.loadImage(1024, false));
  await page.evaluate(() => { const i = document.getElementById('strength'); i.value = 2; i.dispatchEvent(new Event('input')); });
  if (process.env.PUSH_FIELD) await page.check('#field');
  await page.evaluate(() => window.__push.stop());
  await page.waitForTimeout(100);
  const box = await page.locator('#stage').boundingBox();
  await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.42);
  await page.mouse.down();
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(box.x + box.width * (0.18 + 0.05 * i), box.y + box.height * (0.42 + 0.012 * i));
    await page.evaluate(() => window.__push.step(1 / 60));
  }
  await page.mouse.up();
  await page.evaluate(() => { for (let i = 0; i < 5; i++) window.__push.step(1 / 60); });
};
