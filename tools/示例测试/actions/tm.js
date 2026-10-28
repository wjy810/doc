// 16-08：打开“每分钟轻响”、关掉声音，用虚拟时钟走完一整轮；再重置，停在 24:10（还剩约 1 分钟）
module.exports = async page => {
  await page.waitForFunction(() => window.__tm, null, { timeout: 30000 });
  await page.click('#tick'); await page.click('#snd');
  const MIN = 60000, jump = ms => page.evaluate(ms => window.__tm.jump(ms), ms);
  await jump(0); await page.click('#go');
  for (let t = 1000; t <= 3 * MIN; t += 1000) await jump(t);   // 前 3 分钟逐秒前进（前台）
  for (const t of [24 * MIN + 10000, 25 * MIN + 20000, 29 * MIN + 10000, 30 * MIN + 5000]) { await jump(t); await page.waitForTimeout(80); }   // 之后几次大跳（像从后台回来）
  const v = await page.evaluate(() => window.__tm.verify());
  const log = await page.evaluate(() => window.__tm.log().map(l => `${l.at} ${l.k}`));
  await page.click('#reset'); await jump(0); await page.click('#go'); await jump(24 * MIN + 10000); await page.waitForTimeout(300);
  console.log(JSON.stringify({ all: await page.evaluate(() => window.__tm.all), kept: await page.evaluate(() => window.__tm.kept), o0: await page.evaluate(() => window.__tm.o0), o1: await page.evaluate(() => window.__tm.o1), peak: await page.evaluate(() => window.__tm.peak), v, log, state: await page.evaluate(() => [document.getElementById('timer').dataset.state, document.getElementById('stext').textContent, document.getElementById('clock').textContent, document.getElementById('live').textContent, document.title]) }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
