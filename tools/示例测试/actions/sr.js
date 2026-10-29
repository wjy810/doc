// 18-11 自评与评审：像学习者一样在表格里选状态、填证据，再检查评审记录
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const row = k => page.locator(`#sa tr[data-k="${k}"]`);
  const setState = async (k, s) => { await row(k).locator(`[data-s="${s}"]`).click(); await sleep(80); };
  const fill = async (k, f, v) => { const i = row(k).locator(`[data-f="${f}"]`); await i.fill(v); await i.dispatchEvent('change'); await sleep(120); };
  // 示例学习者的填写（构造的内容）
  await setState(0, 2); await fill(0, 'ev', '图片/18-03-asset-audit.png');
  await setState(1, 1); await fill(1, 'ev', '图片/18-04-component-catalog.png'); await fill(1, 'note', '助教带着完成了采用度统计');
  await setState(2, 3); await fill(2, 'ev', '图片/18-05-visual-checks.png'); await fill(2, 'ev2', '图片/18-09-acceptance-checks.png');
  await setState(3, 2);                                                       // 选了“能够独立完成”却没有证据
  await setState(4, 3); await fill(4, 'ev', '图片/18-07-perf.png');           // 路径写错；也没有第二处证据
  await setState(5, 1); await fill(5, 'ev', '图片/18-08-gallery-performance.png');   // 在指导下完成，但没写谁指导
  await sleep(300);
  const sa = await page.evaluate(() => window.__sr.SA.map(a => `${a.name}:${a.state}:${(a.need || []).join('|') || 'ok'}`));
  const rv = await page.evaluate(() => window.__sr.renderReview());
  console.log(sa.join('\n')); console.log(JSON.stringify(rv));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
