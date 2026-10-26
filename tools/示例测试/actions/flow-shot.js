module.exports = async page => {
  await page.click('#card-1'); await page.waitForTimeout(500);
  await page.click('#edit'); await page.waitForTimeout(400);
  await page.fill('#title-input', '前端开发实习生（React）');
  await page.click('#save'); await page.waitForTimeout(800);
};
