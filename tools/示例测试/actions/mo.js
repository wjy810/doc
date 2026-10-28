// 13-06：在 B 中悬停“公开到人才库”看预览；两边都选“公开”，再收回链接；B 撤销一次
module.exports = async page => {
  await page.hover('#dlgB .opts label:nth-child(4)'); await page.waitForTimeout(100);
  const pv = await page.locator('#dlgB [data-preview]').innerText();
  for (const k of ['A', 'B']) { await page.check(`#dlg${k} input[value=public]`); await page.waitForTimeout(80); await page.click(`#dlg${k} [data-revoke]`); await page.waitForTimeout(80); }
  await page.click('#dlgB [data-undo]'); await page.waitForTimeout(80);
  await page.hover('#dlgB [data-revoke]'); await page.waitForTimeout(80);
  console.log(JSON.stringify({ pv, sum: await page.evaluate(() => window.__mm.sum), A: await page.evaluate(() => window.__mm.stA.s), B: await page.evaluate(() => window.__mm.stB.s), statusB: await page.locator('#dlgB [data-status]').innerText(), preview2: await page.locator('#dlgB [data-preview]').innerText() }, null, 1));
};
