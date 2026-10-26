module.exports = async page => {
  const order = () => page.$$eval('#list li b', els => els.map(e => e.textContent.slice(0, 2)).join(','));
  await page.click('[data-sort="pay"]'); await page.waitForTimeout(100);
  await page.click('[data-sort="date"]'); await page.waitForTimeout(100);
  await page.click('[data-sort="pay"]'); await page.waitForTimeout(600);
  console.log('rapid → pay:', await order(), '| running:', await page.evaluate(() => document.getAnimations().length));
  await page.click('#remove'); await page.waitForTimeout(800);
  console.log('removed:', await order());
  await page.click('#reset'); await page.waitForTimeout(600);
  console.log('reset:', await order());
  await page.click('#card-b'); await page.waitForTimeout(500);
  console.log('detail:', await page.textContent('#view h3'), '| focus:', await page.evaluate(() => document.activeElement.id));
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  console.log('back focus:', await page.evaluate(() => document.activeElement.id));
};
