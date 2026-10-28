// 12-10：用真实鼠标拖出矩形，再依次点五个工具；修改间距、数据与目标，每次检查“画出来的”与“代码运行出来的”是否相同
module.exports = async page => {
  const box = await page.locator('#canvas').boundingBox(), S = box.width / 520, P = (x, y) => [box.x + x * S, box.y + y * S];
  await page.mouse.move(...P(40, 270)); await page.mouse.down(); await page.mouse.move(...P(84, 162), { steps: 12 }); await page.mouse.up(); await page.waitForTimeout(100);
  for (const id of ['#tBind', '#tRepeat', '#tLabel', '#tMean', '#tColor']) { await page.click(id); await page.waitForTimeout(60); }
  const out = [];
  out.push(await page.evaluate(() => window.__md.check('五步完成后')));
  await page.fill('#steps input[data-k="dx"]', '48'); await page.press('#steps input[data-k="dx"]', 'Tab'); await page.waitForTimeout(100);
  out.push(await page.evaluate(() => window.__md.check('间距 60 → 48')));
  await page.evaluate(() => window.__md.setData('第1周,6\n第2周,11\n第3周,4\n第4周,8\n第5周,10\n第6周,7\n第7周,9\n第8周,12\n第9周,5')); await page.waitForTimeout(100);
  out.push(await page.evaluate(() => window.__md.check('数据改为 9 行')));
  await page.fill('#steps input[data-k="threshold"]', '9'); await page.press('#steps input[data-k="threshold"]', 'Tab'); await page.waitForTimeout(100);
  out.push(await page.evaluate(() => window.__md.check('目标 8 → 9 小时')));
  await page.evaluate(() => { window.__md.select(2); window.__md.compare(); });
  console.log(JSON.stringify({ out, steps: await page.evaluate(() => window.__md.steps.map(s => [s.op, s.desc])), actions: await page.evaluate(() => window.__md.actions), code: await page.locator('#code').innerText() }, null, 1));
};
