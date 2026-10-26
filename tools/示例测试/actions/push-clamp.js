// 连续快速划动后，读出扰动场，检查最大位移是否被限制在 0.08 以内；再等待恢复
module.exports = async page => {
  const box = await page.locator('#stage').boundingBox();
  await page.evaluate(() => { const i = document.getElementById('strength'); i.value = 3; i.dispatchEvent(new Event('input')); });
  let peak = 0;
  for (let k = 0; k < 6; k++) {
    await page.mouse.move(box.x + box.width * 0.1, box.y + box.height * 0.5);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) { await page.mouse.move(box.x + box.width * (0.1 + 0.08 * i), box.y + box.height * (0.5 + (i % 2) * 0.02)); await page.waitForTimeout(8); }
    await page.mouse.up();
    peak = Math.max(peak, await page.evaluate(() => window.__push.maxDisplacement()));
  }
  console.log('peak displacement after 6 fast swipes:', peak.toFixed(4));
  for (const ms of [300, 1000, 2500]) { await page.waitForTimeout(ms); console.log(`+${ms}ms max:`, (await page.evaluate(() => window.__push.maxDisplacement())).toFixed(4)); }
};
