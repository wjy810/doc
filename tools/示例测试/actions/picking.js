module.exports = async page => {
  await page.getByRole('button', { name: '灯环' }).click();
  await page.waitForTimeout(600);
};
