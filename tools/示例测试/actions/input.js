module.exports = async page => {
  const box = await page.locator('#c').boundingBox();
  await page.mouse.move(box.x + 60, box.y + 120);
  for (let i = 0; i < 60; i++) {
    const x = 60 + i * 9 + (i % 3) * 6;
    const y = 120 + Math.sin(i / 5) * 60 + ((i * 7) % 11) - 5;
    await page.mouse.move(box.x + x, box.y + y);
    await page.waitForTimeout(16);
  }
  await page.waitForTimeout(100);
};
