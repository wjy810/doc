module.exports = async page => {
  const s1 = () => page.textContent('#s1');
  await page.click('#play'); await page.waitForTimeout(700); await page.click('#pause'); await page.waitForTimeout(150);
  console.log('paused:', await s1());
  await page.click('#reverse'); await page.waitForTimeout(300); console.log('reverse:', await s1());
  await page.click('#fast'); await page.waitForTimeout(150); console.log('fast:', await s1());
  await page.click('#retarget'); await page.waitForTimeout(800); console.log('retarget:', await s1(), '| x =', await page.evaluate(() => Math.round(new DOMMatrix(getComputedStyle(document.getElementById('dot')).transform).m41)), 'of', await page.evaluate(() => document.getElementById('track').clientWidth - 46));
  await page.click('#qstart'); await page.waitForTimeout(1000); await page.click('#qcancel'); await page.waitForTimeout(200);
  console.log('queue:', await page.textContent('#s2'), '| bar colors:', await page.$$eval('#steps i', els => els.map(e => getComputedStyle(e).backgroundColor).join(' ')));
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  console.log('hidden:', await page.textContent('#s4'));
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.click('#cancel'); await page.waitForTimeout(200); console.log('after cancel:', await page.textContent('#s3'));
  await page.click('#bench'); await page.waitForTimeout(4700);
  console.log('bench:', await page.$$eval('#bres tr', rows => rows.map(r => r.textContent).join(' | ')));
  // 截图状态：重新播放并暂停在中途
  await page.click('#play'); await page.waitForTimeout(800); await page.click('#pause');
  await page.click('#qstart'); await page.waitForTimeout(1000);
};
