// 11-08：用真实的鼠标操作拖动、调整、创建；再改属性面板、改代码、撤销
module.exports = async page => {
  const box = await page.locator('#stage').boundingBox(), P = (x, y) => [box.x + x * box.width / 600, box.y + y * box.height / 400];
  const drag = async (a, b, steps = 25) => { await page.mouse.move(...P(...a)); await page.mouse.down(); await page.mouse.move(...P(...b), { steps }); await page.mouse.up(); await page.waitForTimeout(100); };
  await drag([400, 220], [355, 168]);            // 拖动黄色块：靠近卡片的上边，触发吸附
  await page.mouse.click(...P(100, 150)); await page.waitForTimeout(50);   // 先选中卡片
  await drag([280, 260], [310, 290]);            // 拖动卡片右下角的手柄：调整大小
  await page.fill('#p-fill', '#e4572e'); await page.press('#p-fill', 'Enter'); await page.waitForTimeout(100);
  await page.evaluate(() => { const m = JSON.parse(document.getElementById('code').value); m[0].text = '简历分析报告（第 2 版）'; window.__dm.setCode(JSON.stringify(m, null, 1)); window.__dm.commitCode(); });
  await page.evaluate(() => { window.__dm.setCode('[{ "id": "card", "x": 50 '); window.__dm.commitCode(); });
  await page.evaluate(() => { const m = JSON.parse(JSON.stringify(window.__dm.model.elements)); window.__dm.setCode(JSON.stringify(m, null, 1)); window.__dm.commitCode(); });   // 修好草稿
  await drag([420, 300], [560, 380]);            // 在空白处拖出新矩形
  await page.click('#undo'); await page.waitForTimeout(50); await page.click('#undo'); await page.waitForTimeout(100);
  const r = await page.evaluate(() => window.__dm.rows);
  // 截图前：按住鼠标把黄色块拖到与卡片底边对齐的位置，画面上显示参考线
  await page.mouse.move(...P(350, 160)); await page.mouse.down(); await page.mouse.move(...P(420, 236), { steps: 15 }); await page.waitForTimeout(100);
  for (const x of r) console.log(`${x.name} | updates ${x.updates} | undo ${x.undo} | ${x.ok}`);
  console.log(JSON.stringify(await page.evaluate(() => window.__dm.model.elements.map(e => [e.id, e.x, e.y, e.w, e.h, e.fill]))));
};
