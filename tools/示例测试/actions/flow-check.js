module.exports = async page => {
  const focus = () => page.evaluate(() => document.activeElement.id);
  // 快速连续点击两张卡片：最后打开的是第二次点击的那张
  await page.click('#card-1'); await page.waitForTimeout(50);
  console.log('open 1 → focus:', await focus(), '| title:', await page.textContent('#detail-title'));
  await page.click('#edit'); await page.waitForTimeout(400);
  console.log('editor open:', await page.getAttribute('#editor', 'class'), '| focus:', await focus(), '| height:', await page.evaluate(() => document.getElementById('editor').getBoundingClientRect().height));
  await page.fill('#title-input', '前端开发实习生（React）');
  await page.click('#save'); await page.click('#save'); await page.keyboard.press('Escape');   // 保存中连点、按 Esc 都应被忽略
  await page.waitForTimeout(100);
  console.log('saving:', await page.getAttribute('#save', 'data-state'), '| still detail:', !!(await page.$('#detail-title')));
  await page.waitForTimeout(700);
  console.log('saved:', await page.getAttribute('#save', 'data-state'), '| title:', await page.textContent('#detail-title'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  console.log('back → focus:', await focus(), '| card title:', await page.textContent('#card-1 b'));
  // 键盘：Tab 到第三张卡片，回车打开，Esc 返回
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  console.log('kbd open:', await page.textContent('#detail-title'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(500);
  console.log('kbd back focus:', await focus());
};
