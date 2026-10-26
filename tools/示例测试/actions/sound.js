// 打开声音，触发三种事件，启动节拍器；检查音频上下文与节拍的时间间隔
module.exports = async page => {
  await page.click('#sound');
  for (const ev of ['ok', 'bad', 'msg']) { await page.click(`[data-ev="${ev}"]`); await page.waitForTimeout(80); }
  console.log('audio state:', await page.evaluate(() => ctx && ctx.state));
  await page.evaluate(() => {
    window.__beats = [];
    new MutationObserver(() => { const k = [...document.querySelectorAll('#beats i')].findIndex(b => b.classList.contains('on')); if (k >= 0) window.__beats.push([k, performance.now()]); })
      .observe(document.getElementById('beats'), { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  await page.click('#metro'); await page.waitForTimeout(2600);
  const beats = await page.evaluate(() => window.__beats.filter((b, i, a) => i === 0 || b[0] !== a[i - 1][0]));
  const gaps = beats.slice(1).map((b, i) => Math.round(b[1] - beats[i][1]));
  console.log('beats:', beats.map(b => b[0]).join(','), '| gaps ms:', gaps.join(','));
  await page.waitForTimeout(250);
};
