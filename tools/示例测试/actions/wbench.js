// 21-07 项目 06：真实拖动、筛选、重置，核对计算、单位、缺失值与图形映射
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, ev = (f, a) => page.evaluate(f, a);
  const fresh = async v => { await page.goto(base + (v === 'A' ? '?v=a' : '?v=b')); await page.waitForTimeout(200); };
  const fullTotal = () => ev(() => DATA.reduce((s, r) => s + (r.trips ?? 0), 0));
  for (const v of ['A', 'B']) {
    const r = {}; await fresh(v);
    const t = await ev(() => window.__wb.truth()), k = await ev(() => window.__wb.kpis());
    const err = (k.avg - t.avg) / t.avg * 100;
    r.avg = { ok: Math.abs(err) < 1, text: `${Math.round(k.avg)}，误差 ${err.toFixed(1)}%` };
    const low = await ev(() => window.__wb.lowest());
    r.low = { ok: !low.isOutage && low.v > 0, text: `${low.label}：${low.v} 次${low.isOutage ? '（这天其实是数据缺失）' : ''}` };
    const hi = await ev(() => window.__wb.histInfo());
    r.hist = { ok: hi.zeros === 0 && hi.nonEmpty >= 8, text: `${hi.nonEmpty}／${hi.bins} 组有数据；${hi.zeros} 天记成 0${hi.zeros ? '（横轴从 0 开始，真实数据挤在右边几组）' : ''}` };
    // 在柱状图上拖动选择第 3—4 周，再选“周末”
    const box = await page.locator('#trend').boundingBox(), bw = (700 - 46 - 6) / 56, X = i => box.x + 46 + i * bw + bw / 2, Y = box.y + 100;
    await page.mouse.move(X(14), Y); await page.mouse.down(); for (let i = 15; i <= 27; i += 3) await page.mouse.move(X(i), Y); await page.mouse.move(X(27), Y); await page.mouse.up();
    await page.selectOption('#daytype', 'weekend'); await page.waitForTimeout(100);
    const rows = await ev(() => window.__wb.tableRows()), expect = 4 * 5, k2 = await ev(() => window.__wb.kpis()), ts = await ev(() => window.__wb.tableSum());
    r.link = { ok: rows === expect, text: `${rows}／${expect}${rows === expect ? '' : '（表格没有跟随日期范围）'}` };
    r.sum = { ok: k2.total === ts, text: `${k2.total.toLocaleString()}／${ts.toLocaleString()}` };
    r.units = { ok: await ev(() => window.__wb.hasUnits()), text: (await ev(() => window.__wb.hasUnits())) ? '有（次、次／天、分钟）' : '没有单位' };
    await page.click('#reset'); await page.waitForTimeout(100);
    const k3 = await ev(() => window.__wb.kpis()), ft = await fullTotal();
    r.reset = { ok: k3.total === ft, text: k3.total === ft ? `${ft.toLocaleString()}（全部）` : `${k3.total.toLocaleString()}（日期范围没有清除，全部应为 ${ft.toLocaleString()}）` };
    R[v] = r;
  }
  await fresh('B');
  const T = await ev(() => {
    const t = window.__wb.truth(), k = window.__wb.kpis(), low = window.__wb.lowest(), fmt = window.__wb.fmt;
    const nh = w => { const rows = DATA.filter(r => r.district === '南湖' && r.trips !== null && [0, 6].includes(new Date(Date.UTC(2026, 7, 3) + r.i * 864e5).getUTCDay()) === w); return rows.reduce((s, r) => s + r.trips, 0) / rows.length; };
    const miss = DATA.filter(r => r.district === '新区' && r.trips === null).length, missTrue = 8;
    return [['8 周全市日均骑行量', `${Math.round(k.avg).toLocaleString()} 次／天（只算完整的 ${k.completeDays} 天）`, `${Math.round(t.avg).toLocaleString()} 次／天`],
      ['哪一天骑行最少', `${low.label}：${low.v.toLocaleString()} 次`, `${fmt(t.low)}：${t.lowV.toLocaleString()} 次`],
      ['南湖区周末比工作日多多少', `${((nh(true) / nh(false) - 1) * 100).toFixed(0)}%`, `${(t.nanhu * 100).toFixed(0)}%`],
      ['新区有几天缺数据', `${miss} 天`, `${missTrue} 天（生成规则）`]];
  });
  // 完成版截图：选中第 3—4 周
  const box = await page.locator('#trend').boundingBox(), bw = (700 - 46 - 6) / 56, X = i => box.x + 46 + i * bw + bw / 2;
  await page.mouse.move(X(14), box.y + 100); await page.mouse.down(); await page.mouse.move(X(27), box.y + 100); await page.mouse.up();
  await ev(([R, T]) => window.__wb.report(R, T), [R, T]);
  console.log(JSON.stringify(R)); console.log(JSON.stringify(T));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
