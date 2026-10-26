// 输入一个没有结果的关键词，等待防抖与模拟请求完成
module.exports = async page => {
  await page.fill('#q', '薪资谈判');
  await page.waitForTimeout(1400);
  console.log('URL', page.url().split('/').pop(), 'STATUS', await page.textContent('#status'));
};
