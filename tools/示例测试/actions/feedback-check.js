module.exports = async page => {
  await page.fill('#email', 'abc'); await page.click('#submit'); await page.waitForTimeout(200);
  console.log('errors:', await page.textContent('#messages'), '| focus:', await page.evaluate(() => document.activeElement.id));
  await page.click('.summary a >> nth=1'); console.log('link focus:', await page.evaluate(() => document.activeElement.id));
  await page.fill('#name', '李明'); await page.fill('#email', 'liming@example.com'); await page.selectOption('#resume', { index: 1 });
  await page.check('#busy'); await page.dblclick('#submit'); await page.waitForTimeout(900);
  console.log('busy:', await page.textContent('#messages'), '| kept:', await page.inputValue('#name'), await page.inputValue('#email'));
  await page.uncheck('#busy'); await page.click('#submit'); await page.waitForTimeout(900);
  console.log('ok:', await page.textContent('#messages'));
  await page.click('[aria-label="删除收藏：数据分析实习生"]'); console.log('after delete:', await page.textContent('#jobs'));
  await page.click('.toast button'); console.log('after undo:', await page.textContent('#jobs'));
  await page.click('#clear'); console.log('dialog:', await page.textContent('#c-text'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100); console.log('after esc:', (await page.$$('#jobs li')).length);
};
