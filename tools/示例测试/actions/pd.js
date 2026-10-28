// 15-10：读取核验结果；回答预测题（选“变长约 7%”）；把动画停在 t = 3.0 s
module.exports = async page => {
  await page.waitForFunction(() => window.__pd, null, { timeout: 30000 });
  await page.click('#pred button[data-k="1"]');
  await page.evaluate(() => window.__pd.pause(3.0));
  await page.waitForTimeout(200);
  console.log(JSON.stringify(await page.evaluate(() => { const { pause, ...rest } = window.__pd; return { ...rest, out: document.getElementById('predOut').innerText }; })));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
