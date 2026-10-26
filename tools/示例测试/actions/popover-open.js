// 点击下方的“排序方式”按钮，打开 popover 菜单
module.exports = async page => {
  await page.click('#open2');
  await page.waitForTimeout(200);
  console.log('POPOVER', await page.evaluate(() => document.getElementById('m2').matches(':popover-open')));
};
