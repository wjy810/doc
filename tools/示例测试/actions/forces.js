module.exports = async page => {
  console.log('fixed:', JSON.stringify(await page.evaluate(() => window.__forces.hiccupTest(true))));
  console.log('naive:', JSON.stringify(await page.evaluate(() => window.__forces.hiccupTest(false))));
  await page.evaluate(() => { document.getElementById('reset').click(); window.__forces.warm(6); });
  // 真实卡顿：点击按钮后观察状态
  await page.evaluate(() => { document.getElementById('pause').click(); });
};
