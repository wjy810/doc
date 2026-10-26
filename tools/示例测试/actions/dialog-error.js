// 打开对话框，清空名称后点击保存，显示错误状态
module.exports = async page => {
  await page.click('#open');
  await page.fill('#name', '');
  await page.click('#save');
  await page.waitForTimeout(300);
  const state = await page.evaluate(() => ({ open: document.getElementById('dlg').open, invalid: document.getElementById('name').getAttribute('aria-invalid'), err: document.getElementById('name-error').textContent, focus: document.activeElement.id }));
  console.log('STATE', JSON.stringify(state));
  // 再测试：保存一次，然后重新打开并按 Esc，名称不应改变
  await page.fill('#name', '前端实习简历 2026 秋');
  await page.click('#save');
  await page.waitForTimeout(200);
  await page.click('#open');
  await page.fill('#name', '不应保存的名称');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  console.log('AFTER-ESC', await page.textContent('#result'), 'focus=', await page.evaluate(() => document.activeElement.id));
  // 回到错误状态用于截图
  await page.click('#open');
  await page.fill('#name', '');
  await page.click('#save');
  await page.waitForTimeout(300);
};
