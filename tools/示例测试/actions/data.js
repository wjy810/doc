module.exports = async page => {
  await page.waitForTimeout(400);
  console.log('sim report:', await page.$$eval('#report li', l => l.map(x => x.textContent).join(' | ')));
  // 突变：平滑开启与关闭时，第 80—81 格（噪声 88 → 45）画面数值的变化
  const jump = await page.evaluate(() => [true, false].map(s => { const o = window.__data.clean(s).out.noise; return +(o[81].n - o[80].n).toFixed(2); }));
  console.log('noise step 80→81 (smooth on, off):', jump);
  // 导入一份带空值、越界和错误的 CSV
  const fs = require('fs'), f = require('path').join(require('os').tmpdir(), 'city.csv');
  const lines = ['time,temperature,wind,noise'];
  for (let i = 0; i < 96; i++) { const t = `${String(Math.floor(i / 4)).padStart(2, '0')}:${String(i % 4 * 15).padStart(2, '0')}`; lines.push(`${t},${i === 10 ? '' : (12 + i / 10).toFixed(1)},${i === 30 ? 99 : 4},${i === 50 ? -10 : 55}`); }
  fs.writeFileSync(f, lines.join('\n'));
  await page.setInputFiles('#csv', f); await page.waitForTimeout(400);
  console.log('csv report:', await page.$$eval('#report li', l => l.map(x => x.textContent).join(' | ')), '| tag:', await page.textContent('#srcTag'));
  await page.click('#sim'); await page.waitForTimeout(300);
};
