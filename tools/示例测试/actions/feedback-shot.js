module.exports = async page => {
  await page.fill('#email', 'abc'); await page.click('#submit'); await page.waitForTimeout(200);
  await page.click('[aria-label="删除收藏：数据分析实习生"]'); await page.waitForTimeout(200);
};
