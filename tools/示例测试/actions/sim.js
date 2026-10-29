// 19-10 模拟：群体 300 步、烟雾两种时间步长各 120 步
module.exports = async page => {
  const ev = (f, a) => page.evaluate(f, a);
  const B = await ev(() => __sim.runBoids());
  const F = {}; for (const v of ['A', 'B']) for (const dt of [0.01, 0.1]) F[v + dt] = await ev(([v, dt]) => __sim.runSmoke(v, dt), [v, dt]);
  console.log(JSON.stringify({ B, F }, (k, x) => typeof x === 'number' ? +x.toPrecision(4) : x));
  await ev(([B, F]) => {
    const c = (ok, t) => `<td class="num ${ok ? 'good' : 'poor'}">${t}</td>`;
    __sim.fill('tB', `<tr><th></th><th>每步距离比较</th><th>每步耗时</th><th>平均速度（第 50、150、300 步）</th><th>最大速度</th></tr>` + ['A', 'B'].map(v => { const x = B[v]; return `<tr><th>${v}</th><td class="num">${x.cmp.toLocaleString('zh-CN')}</td><td class="num">${x.ms.toFixed(1)} 毫秒</td>${c(x.speeds[x.speeds.length - 1] < 3, [0, 2, 5].map(i => x.speeds[i] > 1000 ? x.speeds[i].toExponential(1) : x.speeds[i].toFixed(2)).join('、'))}${c(x.maxSpeed < 3, x.maxSpeed > 1000 ? x.maxSpeed.toExponential(1) : x.maxSpeed.toFixed(2))}</tr>`; }).join('') + `<tr><td colspan="5">同一帧里，两种查询找到的邻居${B.same ? '完全相同' : '不同'}：网格只是少做了无用的比较。</td></tr>`);
    __sim.fill('tF', `<tr><th></th><th>时间步</th><th>扩散系数 k·dt·N²</th><th>最大速度·dt·N</th><th>留在网格里的烟／注入的烟</th><th>最小密度</th><th>最大密度</th></tr>` + ['A', 'B'].flatMap(v => [0.01, 0.1].map(dt => { const x = F[v + dt]; const blow = x.bad || Math.abs(x.max) > 1e3; return `<tr><th>${v}</th><td class="num">${dt}</td><td class="num">${x.coef.toFixed(2)}${v === 'A' && x.coef > 0.25 ? '（超过 0.25）' : ''}</td><td class="num">${x.cfl.toFixed(2)}${v === 'A' && x.cfl > 1 ? '（超过 1）' : ''}</td>${c(!blow && x.sum <= x.injected * 1.001, blow ? '发散' : (x.sum / x.injected * 100).toFixed(0) + '%')}${x.bad ? `<td class="poor" colspan="2">${x.bad} 格全部是无效数值（NaN）</td>` : c(x.min > -0.01, x.min < -1e3 ? x.min.toExponential(1) : x.min.toFixed(3)) + c(!blow, Math.abs(x.max) > 1e3 ? x.max.toExponential(1) : x.max.toFixed(2))}</tr>`; })).join(''));
    document.getElementById('tF').insertAdjacentHTML('afterend', '<p class="m">A 在时间步 0.1 时扩散系数超过 0.25、平流每步移动超过一格，几步之内就发散。B 两种步长都稳定，但稳定不等于准确：大步长下烟更快被带出网格（只剩 11%），细节也被抹平。选择方法时要先写清模型假设，再按需要的精度选时间步长。</p>');
  }, [B, F]);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
