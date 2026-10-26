module.exports = async page => {
  await page.click('[data-tier="high"]'); await page.waitForTimeout(500);
  await page.evaluate(() => window.__quality.bottleneck());
  await page.evaluate(() => { window.__quality.setTime(3.2); });
  await page.waitForTimeout(300);
  await page.waitForTimeout(1200);
  console.log(await page.textContent('#verdict'), '|', await page.textContent('#info'));
};
