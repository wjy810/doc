// 截图：拖动中的卡片（向右约 90 像素，显示“收藏”），以及放大并旋转后的图片
module.exports = async page => {
  await page.click('[data-z="1.2"]'); await page.click('[data-r="15"]');
  const box = await page.locator('#deck').boundingBox();
  const cx = box.x + box.width / 2, cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy); await page.mouse.down();
  for (let i = 1; i <= 9; i++) { await page.mouse.move(cx + i * 10, cy + i); await page.waitForTimeout(20); }
};
