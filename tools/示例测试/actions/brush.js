module.exports = async page => {
  const box = await page.locator('#c').boundingBox();
  const stroke = async (pts, opts = {}) => {
    if (opts.color) await page.locator('#color').fill(opts.color);
    if (opts.size) await page.locator('#size').fill(String(opts.size));
    await page.mouse.move(box.x + pts[0][0], box.y + pts[0][1]);
    await page.mouse.down();
    for (const [x, y] of pts.slice(1)) await page.mouse.move(box.x + x, box.y + y, { steps: 4 });
    await page.mouse.up();
  };
  const wave = [];
  for (let i = 0; i <= 40; i++) wave.push([40 + i * 13, 160 + Math.sin(i / 4) * 70]);
  await stroke(wave, { color: '#2f6fdb', size: 14 });
  const loop = [];
  for (let i = 0; i <= 50; i++) { const a = i / 50 * Math.PI * 2; loop.push([320 + Math.cos(a) * 90, 160 + Math.sin(a) * 60]); }
  await stroke(loop, { color: '#e4572e', size: 8 });
  await page.waitForTimeout(200);
};
