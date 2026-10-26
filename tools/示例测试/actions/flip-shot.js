// 排序动画与卡片展开动画各定格在一半
module.exports = async page => {
  await page.click('[data-sort="pay"]'); await page.waitForTimeout(140);
  await page.evaluate(() => document.getAnimations().forEach(a => a.pause()));
  await page.click('#card-a'); await page.waitForTimeout(150);
  await page.evaluate(() => document.getAnimations().forEach(a => { if (a.playState === 'running') a.pause(); }));
  await page.waitForTimeout(100);
};
