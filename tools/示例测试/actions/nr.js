// 14-06：用鼠标滚轮读到第 3 章，用目录跳到第 5 章，用键盘 K 回到第 4 章，再打开“减少动效”，最后检查读者控制
module.exports = async page => {
  const b = await page.locator('#story').boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 60); await page.waitForTimeout(120); }
  await page.waitForTimeout(400);
  await page.click('#toc a[data-i="4"]'); await page.waitForTimeout(1300);
  await page.focus('#story'); await page.keyboard.press('k'); await page.waitForTimeout(700);
  await page.check('#reduced'); await page.waitForTimeout(100);
  const r = await page.evaluate(() => window.__nar.check());
  console.log(JSON.stringify(r));
};
