// 16-03：真实按 Tab 记录两组链接的焦点顺序；再打开“减少动态效果”
module.exports = async page => {
  await page.waitForFunction(() => window.__a11y, null, { timeout: 30000 });
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');   // 从页面开头按 Tab：正数 tabindex 先被访问
  await page.focus('#d1b button');
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  await page.evaluate(() => window.__a11y.report2());
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(300);
  await page.evaluate(() => document.activeElement.blur());
  console.log(JSON.stringify(await page.evaluate(() => window.__a11y.R)));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
