module.exports = async page => {
  // 定格在固定时刻，截图可以复现
  await page.evaluate(() => { window.__shader.setTime(1.2); });
  await page.click('#pause');
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({ err: document.getElementById('err').textContent, programs: window.__shader.renderer.info.programs.length, calls: window.__shader.renderer.info.render.calls }));
  console.log('shader info:', JSON.stringify(info));
};
