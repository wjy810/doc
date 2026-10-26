// 验证：拖动吸附、撤销与重做、方向键与按钮移动、删除后撤销
const pos = page => page.$$eval('.card', els => els.map(e => e.textContent.slice(0, 4) + '@' + e.style.left + ',' + e.style.top).join(' '));
module.exports = async page => {
  const box = await page.locator('#board').boundingBox();
  const at = (x, y) => [box.x + x, box.y + y];
  await page.mouse.move(...at(130, 160)); await page.mouse.down(); await page.mouse.move(...at(163, 187), { steps: 6 }); await page.mouse.up();
  console.log('drag  ', await pos(page));
  await page.keyboard.press('Control+z'); console.log('undo  ', await pos(page));
  await page.keyboard.press('Control+Shift+z'); console.log('redo  ', await pos(page));
  await page.keyboard.press('ArrowRight'); console.log('arrow ', await pos(page));
  await page.click('[aria-label="下移"]'); console.log('button', await pos(page));
  await page.keyboard.press('Delete'); console.log('delete', (await page.$$('.card')).length, 'cards |', await page.textContent('#status'));
  await page.keyboard.press('Control+z'); console.log('undo  ', (await page.$$('.card')).length, 'cards');
  console.log('history:', await page.$$eval('#history li', els => els.map(e => e.textContent + (e.className ? '(已撤销)' : '')).join(' / ')));
};
