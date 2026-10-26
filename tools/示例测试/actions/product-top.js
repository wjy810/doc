module.exports = async page => {
  await page.screenshot({ path: process.env.SHOT1 });          // 默认视角
  await page.getByRole('button', { name: '顶部' }).click();
  await page.waitForTimeout(1500);                              // 之后由 --out 截取顶部视角
};
