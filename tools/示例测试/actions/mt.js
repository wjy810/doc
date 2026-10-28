// 12-09：勾选同意书、开始、完成两项任务、退出研究；读取样本量、拉丁方检查与退出后的数据
module.exports = async page => {
  await page.click('#qm tr[data-i="3"] td'); await page.evaluate(() => document.querySelector('#qm tr[data-i="3"]').classList.add('sel'));
  for (const b of await page.$$('#consent input')) await b.check();
  await page.click('#agree'); await page.evaluate(() => { window.__task(1); window.__task(2); });
  await page.click('#quit'); await page.waitForTimeout(200);
  console.log(JSON.stringify(await page.evaluate(() => ({ power: window.__methods.powerRows, W: window.__methods.W, pos: window.__methods.pos, pairs: window.__methods.pairsOk, quit: window.__quit, people: window.__methods.people }))));
};
