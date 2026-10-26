module.exports = async page => {
  await page.locator('#c').focus();
  await page.keyboard.press('Space');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(1800);
};
