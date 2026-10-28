// 15-11：测量；检查详情、Esc 与退出；走一段真实的导览动画；最后站到能看见第 2、3 件和地面箭头的位置
module.exports = async page => {
  await page.waitForFunction(() => window.__ex, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => window.__ex.measure());
  console.log(JSON.stringify(m));
  await page.click('#detailBtn'); const detail = await page.evaluate(() => window.__ex.state().detail);
  await page.keyboard.press('Escape'); const closed = !(await page.evaluate(() => window.__ex.state().detail));
  await page.click('#exit'); const exited = await page.evaluate(() => window.__ex.state().exited);
  // 真实的导览：从第 1 件走到第 2 件，记录过程中的相机位置
  await page.evaluate(() => { window.__ex.view(...window.__ex.stops[0].pos.toArray().filter((_, i) => i !== 1), 0, 0); });
  await page.click('#next'); const samples = [];
  for (let k = 0; k < 12; k++) { await page.waitForTimeout(1000); samples.push(await page.evaluate(() => window.__ex.state())); }
  console.log(JSON.stringify(samples.map(s => [s.cam[0], s.cam[2], s.yaw])));
  await page.evaluate(() => window.__ex.view(-3.2, 2.2, -32, 1)); await page.waitForTimeout(600);
  await page.evaluate(([m, f]) => window.__ex.report(m, f), [m, { detail, closed, exited }]);
  console.log(JSON.stringify({ detail, closed, exited }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
