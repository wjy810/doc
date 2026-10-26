module.exports = async page => {
  await page.waitForTimeout(300);
  // 收藏：同一区域的三个种子，再从另一个区域加一个
  for (const n of [2, 5, 9]) await page.click(`#sheet figure:nth-child(${n}) .star`);
  await page.evaluate(() => { window.__curate.setPick(0.024, 260); window.__curate.toggleFav({ seed: 3, scale: 0.024, density: 260 }); window.__curate.setPick(0.012, 160); });
  await page.click('#series li:nth-child(2) button');   // 把第 2 个上移
  await page.waitForFunction(() => !document.getElementById('export').disabled);
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#export')]);
  const file = await dl.path(), m = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  console.log('manifest:', JSON.stringify(m.generator), m.works.map(w => `${w.order}:${w.seed}/${w.params.scale}/${w.params.density}/${w.imageSha256.slice(0, 8)}`).join(' '));
  // 重新加载页面，从清单重现
  const copy = require('path').join(require('os').tmpdir(), 'series-manifest.json'); require('fs').copyFileSync(file, copy);
  await page.reload(); await page.waitForTimeout(500);
  await page.setInputFiles('#import', copy); await page.waitForTimeout(800);
  console.log('verify:', await page.textContent('#verify'));
  // 篡改一个哈希，确认能发现不一致
  m.works[0].imageSha256 = '0'.repeat(64); m.generator.version = '0.9.0'; require('fs').writeFileSync(copy, JSON.stringify(m));
  await page.setInputFiles('#import', copy); await page.waitForTimeout(800);
  console.log('tampered:', await page.textContent('#verify'));
  require('fs').copyFileSync(file, copy); await page.setInputFiles('#import', copy); await page.waitForTimeout(800);   // 截图时显示一致的结果
};
