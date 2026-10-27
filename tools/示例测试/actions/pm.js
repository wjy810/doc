// 11-05：等灵敏度分析与恢复检查完成
module.exports = async page => {
  const r = await page.evaluate(() => window.__pm.done);
  for (const s of r.sens) console.log(`${s.label}: ${s.d.toFixed(3)}`);
  console.log('hashes', r.restore.join(' '));
  console.log('note:', await page.locator('#note').textContent());
};
