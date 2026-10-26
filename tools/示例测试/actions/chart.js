module.exports = async page => {
  await page.locator('#filters label', { hasText: '机械' }).locator('input').uncheck();
  await page.waitForTimeout(200);
  const bar = page.locator('.bar').nth(1);
  const b = await bar.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + 20);
  await page.waitForTimeout(300);
};
