// 只用键盘：Tab 到第一张卡片并按回车打开详情
module.exports = async page => {
  for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
  console.log('FOCUS', await page.evaluate(() => document.activeElement.className + ' ' + (document.activeElement.textContent || '').slice(0, 12)));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  console.log('DETAIL', await page.isVisible('#detail'));
};
