// 只用键盘：Tab 进入标签列表，右方向键切换到第二个标签
module.exports = async page => {
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
  console.log('FOCUS', await page.evaluate(() => document.activeElement.textContent + ' selected=' + document.activeElement.getAttribute('aria-selected')));
  await page.keyboard.press('End');
  console.log('END', await page.evaluate(() => document.activeElement.textContent));
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(200);
};
