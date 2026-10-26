module.exports = async page => {
  await page.click('#start');
  await page.waitForTimeout(1200);
};
