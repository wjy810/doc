// 框选左侧三张卡片，左对齐，然后向右拖动到一半时截图（显示吸附参考线）
module.exports = async page => {
  const box = await page.locator('#board').boundingBox();
  const at = (x, y) => [box.x + x, box.y + y];
  await page.mouse.move(...at(20, 20)); await page.mouse.down(); await page.mouse.move(...at(120, 150), { steps: 5 }); await page.mouse.move(...at(230, 300), { steps: 5 }); await page.mouse.up();
  await page.click('#alignLeft');
  await page.mouse.move(...at(90, 160)); await page.mouse.down(); await page.mouse.move(...at(120, 170), { steps: 4 }); await page.mouse.move(...at(151, 176), { steps: 4 });
  console.log(await page.textContent('#status'));
};
