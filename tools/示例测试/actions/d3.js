// 19-08 三维展示：加载中的画面、拖动与缩放到极端、恢复视角；玻璃的可见度、排序损失与绘制成本
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a), R = { A: {}, B: {} };
  // 加载期间读页面：B 的占位与进度文字；A 的画布上有没有模型
  const early = await ev(() => ({ A: window.__d3 ? '已加载' : '画布空白，没有任何提示', B: (document.querySelector('#pB .poster') || {}).textContent || '已加载' }));
  await page.waitForFunction(() => window.__d3, null, { timeout: 30000 });
  for (const v of ['A', 'B']) {
    const P = await ev(v => ({ fp: __d3.P[v].firstPaint, hint: !!document.querySelector('#p' + v + ' .hint:not([hidden])'), view: __d3.P[v].view() }), v);
    R[v].load = P;
    const b = await page.locator(`#p${v} canvas`).boundingBox(), cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    // 向上拖很多（相机转到地面以下），再滚轮缩小很多
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 40, cy - 200, { steps: 15 }); await page.mouse.up();
    await page.mouse.move(cx, cy); for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 400); await sleep(30); }
    await sleep(200);
    R[v].after = await ev(v => ({ view: __d3.P[v].view(), hint: !!document.querySelector('#p' + v + ' .hint:not([hidden])') }), v);
    R[v].shot = 'data:image/png;base64,' + (await page.locator('#p' + v).screenshot()).toString('base64');
    const rb = page.locator(`#p${v} .reset`);
    if (await rb.count()) { await rb.click(); await sleep(100); R[v].reset = await ev(v => __d3.P[v].view(), v); }
  }
  for (const v of ['A', 'B']) R[v].glass = await ev(v => ({ vis: __d3.glassVisibility(v), sort: __d3.sortingLoss(v), info: __d3.G[v].info }), v);
  for (const v of ['A', 'B']) R[v].glass.ms = await ev(v => __d3.frameCost(v), v);
  R.C = { info: await ev(() => __d3.useTransmission(true)) }; R.C.vis = await ev(() => __d3.glassVisibility('B')); R.C.sort = await ev(() => __d3.sortingLoss('B')); R.C.ms = await ev(() => __d3.frameCost('B')); await ev(() => __d3.useTransmission(false));
  console.log(JSON.stringify(R, (k, x) => typeof x === 'string' && x.startsWith('data:') ? '…' : typeof x === 'number' ? +x.toFixed(1) : x));
  await ev(([R, early]) => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`, vw = x => `距离 ${x.dist.toFixed(1)}，俯仰 ${x.polar.toFixed(0)}°${x.below ? '（在地面以下）' : ''}`;
    __d3.fill('tP', `<tr><th></th><th>加载中</th><th>操作提示</th><th>拖动、缩小到极端后</th><th>恢复视角</th></tr>` + ['A', 'B'].map(v => { const x = R[v]; return `<tr><th>${v}</th>${c(v === 'B', early[v])}${c(x.load.hint && !x.after.hint, x.load.hint ? '显示，第一次操作后隐藏' : '没有')}${c(!x.after.view.below && x.after.view.dist <= 7.01, vw(x.after.view))}${c(!!x.reset, x.reset ? '回到 ' + vw(x.reset) : '没有办法回去')}</tr>`; }).join(''));
    __d3.fill('tG', `<tr><th></th><th>玻璃改变了多少像素（平均差）</th><th>重叠处后面的杯子被挡掉</th><th>绘制调用</th><th>每帧时间</th></tr>` + ['A', 'B', 'C'].map(v => { const g = v === 'C' ? R.C : R[v].glass; return `<tr><th>${v === 'C' ? 'B 换成透射' : v}</th>${c(g.vis.mean > 25, g.vis.area + ' 个（' + g.vis.mean.toFixed(0) + '）')}${c(g.sort.lost / Math.max(1, g.sort.overlap) < 0.1, g.sort.lost + '／' + g.sort.overlap + ' 像素')}<td class="num">${g.info.calls}</td><td class="num">${g.ms.toFixed(1)} 毫秒</td></tr>`; }).join(''));
    __d3.fill('mG', `透射材质最像玻璃（背景被折射），但要先把不透明的物体额外渲染一遍，绘制调用从 ${R.B.glass.info.calls} 次变成 ${R.C.info.calls} 次；而且透射物体在那一遍里看不到其他透射物体，重叠处后面的杯子 ${R.C.sort.lost}／${R.C.sort.overlap} 像素看不见。`);
  }, [R, early]);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
