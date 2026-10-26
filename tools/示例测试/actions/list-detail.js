// 选择分类、改变排序、打开详情；检查地址栏保存了状态，刷新后恢复，后退能回到列表
module.exports = async page => {
  await page.selectOption('#cat', '文章');
  await page.waitForTimeout(1000);
  await page.selectOption('#sort', 'short');
  await page.waitForTimeout(1000);
  await page.click('.card >> nth=1');
  await page.waitForTimeout(300);
  console.log('URL', page.url().split('/').pop(), 'DETAIL', await page.textContent('#detail-title'));
  await page.reload();
  await page.waitForTimeout(1200);
  console.log('AFTER-RELOAD cat=', await page.inputValue('#cat'), 'sort=', await page.inputValue('#sort'), 'detail=', await page.isVisible('#detail'));
  await page.goBack();
  await page.waitForTimeout(400);
  console.log('AFTER-BACK detail=', await page.isVisible('#detail'), page.url().split('/').pop());
  await page.goForward();
  await page.waitForTimeout(400);
  // 快速连续切换分类：只应显示最后一次的结果
  await page.selectOption('#cat', '清单'); await page.selectOption('#cat', '模型'); await page.selectOption('#cat', '文章');
  await page.waitForTimeout(1200);
  console.log('RACE cat=', await page.inputValue('#cat'), 'types=', await page.$$eval('.card .meta', els => [...new Set(els.map(e => e.textContent.split(' ')[0]))].join(',')));
  await page.click('.card >> nth=0');
  await page.waitForTimeout(300);
};
