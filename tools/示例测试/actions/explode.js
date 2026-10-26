module.exports = async page => {
  await page.locator('#amount').fill('70');
  await page.locator('#amount').dispatchEvent('input');
  await page.waitForTimeout(1500);
};
