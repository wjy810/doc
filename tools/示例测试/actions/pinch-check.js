// 用浏览器调试协议发送真实的两点触摸：两指距离变为 2 倍，连线旋转 45 度
module.exports = async page => {
  const client = await page.context().newCDPSession(page);
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const r = await page.locator('#viewer').boundingBox();
  const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
  const touch = (type, pts) => client.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
  await touch('touchStart', [[cx - 40, cy], [cx + 40, cy]]);
  for (let k = 1; k <= 10; k++) {
    const d = 80 * (1 + k / 10), a = Math.PI / 4 * k / 10;
    await touch('touchMove', [[cx - 40, cy], [cx - 40 + d * Math.cos(a), cy + d * Math.sin(a)]]);
  }
  await touch('touchEnd', []);
  await page.waitForTimeout(100);
  console.log('pinch:', await page.evaluate(() => document.getElementById('photo').style.transform));
};
