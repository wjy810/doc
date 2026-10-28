// 13-05：两个界面各做一遍“筛选上海 → 滚动 → 打开第 n 个 → 返回”，检查上下文；B 再把 3 个岗位加入对照
module.exports = async page => {
  const res = {};
  for (const k of ['A', 'B']) {
    const app = `#app${k}`;
    await page.selectOption(`${app} [data-city]`, '上海'); await page.waitForTimeout(100);
    await page.evaluate(a => { const l = document.querySelector(`${a} .list`); l.scrollTop = 120; }, app); await page.waitForTimeout(100);
    const rows = await page.$$(`${app} .row`); const target = rows[Math.min(6, rows.length - 1)]; const id = await target.getAttribute('data-id'); await target.click(); await page.waitForTimeout(100);
    await page.click(k === 'A' ? `${app} [data-back]` : `${app} [data-close]`); await page.waitForTimeout(100);
    res[k] = await page.evaluate(([a, id]) => { const l = document.querySelector(`${a} .list`); const row = l.querySelector(`.row[data-id="${id}"]`); return { city: document.querySelector(`${a} [data-city]`).value, scroll: l.scrollTop, seenMark: !!(row && row.classList.contains('seen')), hist: (document.querySelector(`${a} .hist`) || {}).textContent || '' }; }, [app, id]);
  }
  // B：把 3 个岗位加入对照
  for (const n of [0, 2, 4]) { const rows = await page.$$('#appB .row'); await rows[n].click(); await page.waitForTimeout(80); await page.click('#appB [data-pin]'); await page.waitForTimeout(80); }
  res.pinned = await page.evaluate(() => window.__mem.B.pinned);
  await page.evaluate(r => {
    const t = document.getElementById('ctx'), row = (a, x, y, ok) => t.insertAdjacentHTML('beforeend', `<tr><td>${a}</td><td class="${ok[0] ? 'good' : 'poor'}">${x}</td><td class="${ok[1] ? 'good' : 'poor'}">${y}</td></tr>`);
    row('返回后筛选条件', r.A.city || '被清空（全部）', r.B.city || '被清空', [!!r.A.city, !!r.B.city]);
    row('返回后滚动位置', `${r.A.scroll} 像素（回到顶部）`, `${r.B.scroll} 像素（保持）`, [r.A.scroll > 0, r.B.scroll > 0]);
    row('看过的岗位有标记', r.A.seenMark ? '有' : '没有', r.B.seenMark ? '有' : '没有', [r.A.seenMark, r.B.seenMark]);
    row('浏览历史', '没有', r.B.hist.replace('最近看过：', ''), [false, true]);
    row('并排对照', '只能翻页记忆', `对照栏中 ${r.pinned.length} 个岗位`, [false, true]);
  }, res);
  console.log(JSON.stringify(res), JSON.stringify(await page.evaluate(() => window.__mem.tasks)));
};
