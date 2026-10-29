// 19-07 数据与声音：麦克风被拒、没有设备、静音；图表联动后读出三处显示与合计
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), en = v => ev(v => __ds.energy(v), v), stB = () => ev(() => document.querySelector('#vB .st').textContent);
  const R = { A: {}, B: {} };
  await sleep(1000);
  R.A.load = { e: await en('A'), calls: await ev(() => __ds.MIC.calls), st: await ev(() => document.querySelector('#vA .st').textContent) };
  R.B.load = { e: await en('B'), st: await stB() };
  // B：点“用麦克风”，被拒绝
  await ev(() => { __ds.MIC.mode = 'denied'; __ds.MIC.calls = 0; });
  await page.locator('#vB [data-a=mic]').click(); await sleep(600);
  R.B.denied = { st: await stB(), e: await en('B'), calls: await ev(() => __ds.MIC.calls) };
  await ev(() => { __ds.MIC.mode = 'missing'; });
  await page.locator('#vB [data-a=mic]').click(); await sleep(600);
  R.B.missing = { st: await stB(), e: await en('B') };
  // A：假设麦克风允许了（重新打开页面的效果）
  await ev(() => { __ds.MIC.mode = 'ok'; __ds.V.A.start(); }); await sleep(800);
  R.A.ok = await en('A');
  // 静音
  for (const v of ['A', 'B']) { await page.locator(`#v${v} [data-a=mute]`).click(); await sleep(700); R[v].muted = { e: await en(v), st: await ev(v => document.querySelector('#v' + v + ' .st').textContent, v) }; }
  await page.locator('#vB [data-a=mute]').click(); await sleep(200); await page.locator('#vB [data-a=mute]').click(); await sleep(400);
  // 图表：点“交互设计”那根柱子
  for (const v of ['A', 'B']) { await page.locator(`#c${v} .bar[data-i="1"]`).click(); await sleep(100); R[v].chart = await ev(v => __ds.chartReport(v), v); }
  console.log(JSON.stringify(R, (k, x) => typeof x === 'number' ? +x.toFixed(1) : x));
  await ev(R => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`, e = x => '柱子平均高度 ' + x.toFixed(1) + ' 像素';
    __ds.fill('tV', `<tr><th>情况</th><th>A</th><th>B</th></tr>`
      + `<tr><th>打开页面 1 秒后（麦克风会被拒绝）</th>${c(false, `${e(R.A.load.e)}；已请求麦克风 ${R.A.load.calls} 次，用户还没做任何操作；没有任何说明`)}${c(R.B.load.e > 1, `${e(R.B.load.e)}；“${R.B.load.st}”，没有请求麦克风`)}</tr>`
      + `<tr><th>点“用麦克风”，被拒绝</th><td>（打开时已经请求过，失败后画面一直是空的）</td>${c(R.B.denied.e > 1, `“${R.B.denied.st}”；${e(R.B.denied.e)}`)}</tr>`
      + `<tr><th>没有麦克风设备</th><td>同上</td>${c(R.B.missing.e > 1, `“${R.B.missing.st}”；${e(R.B.missing.e)}`)}</tr>`
      + `<tr><th>静音</th>${c(R.A.muted.e > 1, `${e(R.A.muted.e)}（静音前 ${R.A.ok.toFixed(1)}），画面跟着消失`)}${c(R.B.muted.e > 1, `${e(R.B.muted.e)}；“${R.B.muted.st}”`)}</tr>`);
    const r = x => `选中的柱子：${x.sel}；右图：${x.line}；筛选框：${x.filter}`;
    __ds.fill('tC', `<tr><th></th><th>点“交互设计”那根柱子后</th><th>合计显示</th><th>按数据应为</th><th>坐标轴单位</th></tr>` + ['A', 'B'].map(v => { const x = R[v].chart, same = x.line.startsWith(x.sel) && x.filter === x.sel; return `<tr><th>${v}</th>${c(same, r(x))}${c(Math.abs(x.total - x.truth) < 0.05, x.total + ' 小时')}<td class="num">${x.truth} 小时</td>${c(!x.units.includes('无单位'), x.units.join('、'))}</tr>`; }).join(''));
  }, R);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
