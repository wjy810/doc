// 10-09：打印六种失真的指标；点三次，演示实验记录（不是真实数据）
module.exports = async page => {
  await page.waitForFunction(() => window.__per, null, { timeout: 60000 });
  const r = await page.evaluate(() => window.__per);
  for (const x of r.items) console.log(`${x.name} ${x.param}: mse ${x.mse.toFixed(1)} psnr ${x.psnr.toFixed(2)} ssim ${x.ssim.toFixed(4)}`);
  console.log('trials', r.trials);
  for (const side of ['left', 'right', 'left']) { await page.click('#' + side); await page.waitForTimeout(150); }
};
