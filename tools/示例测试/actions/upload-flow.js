// 走一遍流程：类型错误 → 大小超限 → 上传中断 → 重试 → 分析中；再检查刷新后的恢复
const st = page => page.evaluate(() => JSON.parse(localStorage.getItem('resume-flow-demo')).job.state);
module.exports = async page => {
  await page.evaluate(() => localStorage.clear());
  await page.reload(); await page.waitForTimeout(600);
  const files = page.locator('#files button');
  await files.nth(1).click(); await page.waitForTimeout(500);
  console.log('1', await st(page), await page.textContent('#status'));
  await files.nth(2).click(); await page.waitForTimeout(500);
  console.log('2', await st(page), await page.textContent('#status'));
  await page.check('#netfail');
  await files.nth(0).click(); await page.waitForTimeout(1800);
  console.log('3', await st(page), await page.textContent('#status'));
  // 刷新：失败状态保留
  await page.reload(); await page.waitForTimeout(500);
  console.log('3r', await st(page));
  await page.uncheck('#netfail');
  await page.click('#status button.primary'); await page.waitForTimeout(2000);
  console.log('4', await st(page));
  // 分析中刷新：分析继续
  await page.reload(); await page.waitForTimeout(400);
  console.log('4r', await st(page), await page.textContent('#status'));
  await page.waitForTimeout(2600);
  console.log('5', await st(page), await page.textContent('#status'));
  // 扫描件：分析失败，不提供重试
  await files.nth(3).click(); await page.waitForTimeout(4500);
  console.log('6', await st(page), await page.textContent('#status'));
  // 截图状态：重新上传一份，截在“分析中”
  await files.nth(0).click(); await page.waitForTimeout(2300);
  console.log('7', await st(page));
};
