// 收藏成功；复制（无头浏览器中剪贴板通常不可用，展示替代方式）；打开开关；提交，截在“已提交”
module.exports = async page => {
  await page.click('#fav'); await page.waitForTimeout(700);
  console.log('fav:', await page.getAttribute('#fav', 'aria-pressed'), await page.textContent('#fav-msg'));
  await page.check('#fav-fail'); await page.click('#fav'); await page.waitForTimeout(150);
  console.log('fav optimistic:', await page.getAttribute('#fav', 'aria-pressed'));
  await page.waitForTimeout(600);
  console.log('fav after fail:', await page.getAttribute('#fav', 'aria-pressed'), await page.textContent('#fav-msg'));
  await page.uncheck('#fav-fail');
  await page.click('#copy'); await page.waitForTimeout(300);
  console.log('copy:', await page.textContent('#copy-msg'));
  await page.focus('#sw'); await page.keyboard.press('Space'); await page.waitForTimeout(300);
  console.log('switch:', await page.getAttribute('#sw', 'aria-checked'));
  await page.click('#submit'); await page.click('#submit'); await page.waitForTimeout(200);
  console.log('submit loading:', await page.getAttribute('#submit', 'data-state'));
  await page.waitForTimeout(900);
  console.log('submit:', await page.getAttribute('#submit', 'data-state'), await page.textContent('#submit-msg'));
};
