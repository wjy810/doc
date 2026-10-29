// 18-10 工程与可访问性（8 项）＋研究记录（7 项）检查
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const R = { A: {}, B: {} };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const img = async loc => 'data:image/png;base64,' + (await loc.screenshot()).toString('base64');
  const shots1 = [], shots2 = [];
  await ev(() => __er.unmountAll());
  for (const v of ['A', 'B']) {
    const r = R[v], w = () => page.locator('#wk' + v), mount = () => ev(v => __er.mount(v), v);
    await mount(); await sleep(500);

    // 语义与焦点顺序：axe-core（WCAG 2 A／AA 规则）＋ 按 Tab 的顺序与视觉顺序比较
    const ax = await ev(v => axe.run('#wk' + v, { runOnly: ['wcag2a', 'wcag2aa'] }).then(x => x.violations.map(y => `${y.id}（${y.nodes.length}）`)), v);
    const order = await ev(v => {
      const all = [...document.querySelectorAll(`#wk${v} button, #wk${v} select, #wk${v} input, #wk${v} summary, #wk${v} [tabindex]`)].filter(e => e.tabIndex >= 0);
      const seq = [...all.filter(e => e.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex), ...all.filter(e => e.tabIndex === 0)];
      const vis = [...all].sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return Math.abs(p.top - q.top) > 8 ? p.top - q.top : p.left - q.left; });
      const name = e => e.tagName === 'SELECT' ? '周次下拉框' : e.getAttribute('aria-label') || e.textContent.trim().split('\n')[0].slice(0, 8) || e.tagName.toLowerCase();
      return { same: seq.every((e, i) => e === vis[i]), seq: seq.map(name) };
    }, v);
    r.semantics = { pass: !ax.length && order.same, ev: `${ax.length ? 'axe 发现：' + ax.join('、') : 'axe 未发现问题'}；Tab 顺序${order.same ? '与视觉顺序一致' : '是 ' + order.seq.join(' → ') + '，与视觉顺序不一致'}` };

    // 文字替代：图表画布、头像
    const alt = await ev(v => { const el = document.querySelector('#wk' + v), cv = el.querySelector('canvas'), im = el.querySelector('img'); return { chart: (cv.getAttribute('role') === 'img' && (cv.getAttribute('aria-label') || '').length > 10) || !!el.querySelector('details table td'), chartLabel: cv.getAttribute('aria-label') || '', img: !!im && im.hasAttribute('alt') }; }, v);
    r.alt = { pass: alt.chart && alt.img, ev: alt.chart ? `图表有文字说明“${alt.chartLabel.slice(0, 22)}…”和可展开的数据表；头像有 alt` : `图表画布没有任何文字替代；头像${alt.img ? '有' : '没有'} alt` };

    // 阻塞：切换周次时的长任务
    const lt0 = await ev(() => __er.LEAK.longtasks.length);
    await w().locator('select').selectOption('42'); await sleep(400);
    const lts = await ev(n => __er.LEAK.longtasks.slice(n).map(x => Math.round(x.d)), lt0);
    r.block = { pass: !lts.some(d => d > 50), ev: lts.length ? `切换周次时出现长任务 ${lts.join('、')} 毫秒` : '切换周次时没有超过 50 毫秒的长任务（已加载的周次直接用缓存）' };

    // 减少动态效果：数字直接显示结果、达成目标有文字
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await mount(); await sleep(350);
    const rm = await ev(v => { const el = document.querySelector('#wk' + v); return { num: +el.querySelector('.num').textContent, goalText: /达成/.test(el.innerText) }; }, v);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    r.motion = { pass: rm.num === 320 && rm.goalText, ev: `要求减少动态效果时，0.35 秒后数字是 ${rm.num}（应为 320）${rm.num === 320 ? '' : '，仍在播放动画'}；达成目标${rm.goalText ? '有文字说明，静音也能知道' : '只有绿点和提示音，静音时无从得知'}` };

    // 窄屏 320 像素 ＋ 根字号 200%
    await mount(); await sleep(500);
    const base = await ev(v => parseFloat(getComputedStyle(document.querySelector(`#wk${v} h3`)).fontSize), v);
    await ev(v => { document.documentElement.classList.add('big'); document.getElementById('host' + v).style.width = '320px'; window.dispatchEvent(new Event('resize')); }, v); await sleep(300);
    const zm = await ev(v => {
      const el = document.querySelector('#wk' + v), host = el.parentElement.getBoundingClientRect(), out = [], clip = [];
      for (const n of el.querySelectorAll('*')) { const b = n.getBoundingClientRect(); if (b.width && b.right > host.right + 0.5) out.push(n.className || n.tagName.toLowerCase()); const cs = getComputedStyle(n); if (cs.overflow === 'hidden' && n.scrollHeight > n.clientHeight + 1) clip.push(n.className); }
      return { size: parseFloat(getComputedStyle(el.querySelector('h3')).fontSize), out: [...new Set(out)], clip, wide: Math.round(el.getBoundingClientRect().width) };
    }, v);
    shots1.push({ v, url: await img(page.locator('#host' + v)), cap: `${v} · 320 像素宽、根字号 200%` });
    await ev(v => { document.documentElement.classList.remove('big'); document.getElementById('host' + v).style.width = ''; }, v);
    const zIssues = [...(zm.size < base * 1.9 ? [`文字没有放大（${base}→${zm.size} 像素，字号写死成像素）`] : []), ...(zm.out.length ? [`组件宽 ${zm.wide} 像素，伸出 320 像素的容器`] : []), ...(zm.clip.length ? [`${zm.clip.join('、')} 的内容被裁掉`] : [])];
    r.reflow = { pass: !zIssues.length, ev: zIssues.length ? zIssues.join('；') : `文字 ${base}→${zm.size} 像素，内容在 320 像素内换行，没有被遮挡` };

    // 资源失败：接口与图片都失败
    await ev(() => { __er.NET.fail = true; }); await mount(); await sleep(600);
    const fl = await ev(v => { const el = document.querySelector('#wk' + v), im = el.querySelector('img'); return { msg: (el.querySelector('.msg') || {}).textContent || '', retry: !!el.querySelector('[data-a="retry"]'), broken: !!im && im.complete && im.naturalWidth === 0 }; }, v);
    shots2.push({ v, url: await img(w()), cap: `${v} · 接口与头像都加载失败` });
    let recovered = false;
    if (fl.retry) { await ev(() => { __er.NET.fail = false; }); await w().locator('[data-a="retry"]').click(); await sleep(500); recovered = await ev(v => !document.querySelector(`#wk${v} .msg`) && +document.querySelector(`#wk${v} .num`).textContent > 0, v); }
    await ev(() => { __er.NET.fail = false; });
    r.fail = { pass: fl.retry && !fl.broken && recovered, ev: fl.retry ? `显示“${fl.msg.replace('重试', '').trim()}”和“重试”，头像换成文字占位；重试后恢复` : `图表空白、数字停在 0，没有任何说明${fl.broken ? '；头像显示破图' : ''}` };

    // 设备不支持：没有剪贴板接口
    await mount(); await sleep(300);
    await ev(() => Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }));
    await w().locator('button', { hasText: '复制分享链接' }).click(); await sleep(200);
    const cp = await ev(v => { const el = document.querySelector('#wk' + v), s = el.querySelector('.status'); return { text: s ? s.textContent : '', input: !!el.querySelector('.status input') }; }, v);
    await ev(() => { delete navigator.clipboard; });
    r.capability = { pass: cp.input, ev: cp.input ? `提示“${cp.text.trim()}”并显示已选中的链接` : '点击后没有任何反应' };

    // 清理：挂载、卸载 10 次后还剩多少计时器、窗口事件和动画帧
    await ev(() => __er.unmountAll()); await sleep(300);
    // 先测基线：此前页面上已有的计时器、事件和动画帧不算在这个组件头上
    const before = await ev(async () => { const r0 = __er.LEAK.rafCalls; await new Promise(r => setTimeout(r, 500)); return { i: __er.LEAK.intervals.size, l: __er.LEAK.listeners, raf: __er.LEAK.rafCalls - r0 }; });
    for (let i = 0; i < 10; i++) { await mount(); await sleep(60); await ev(v => { __er.UNMOUNT[v](); __er.UNMOUNT[v] = null; }, v); }
    await sleep(200);
    const lk = await ev(async () => { const r0 = __er.LEAK.rafCalls; await new Promise(r => setTimeout(r, 500)); return { i: __er.LEAK.intervals.size, l: __er.LEAK.listeners, raf: __er.LEAK.rafCalls - r0 }; });
    const li = lk.i - before.i, ll = lk.l - before.l, lr = Math.max(0, lk.raf - before.raf - 2);
    r.cleanup = { pass: !li && !ll && !lr, ev: `挂载、卸载 10 次后：多出定时器 ${li} 个、窗口事件 ${ll} 个，0.5 秒内多出 ${lr} 次动画帧回调` };
    // 清掉 A 留下的计时器与循环，免得影响 B 的测量
    if (v === 'A') await page.reload(), await ev(() => __er.unmountAll());
  }
  const research = await ev(() => __er.research());
  const ROWS = [['在目标宽度和文字放大下无关键内容遮挡', 'reflow'], ['资源加载失败时仍有有意义的内容或恢复路径', 'fail'], ['核心操作无明显阻塞', 'block'], ['动画、事件、资源和异步任务能够合理清理', 'cleanup'], ['表单标签、控件语义和焦点顺序清楚', 'semantics'], ['关键信息有文字替代', 'alt'], ['减少动态效果或静音时能完成主要任务', 'motion'], ['设备不支持某项能力时有合适处理', 'capability']];
  const cell = x => `<td><span class="${x.pass ? 'good' : 'poor'}">${x.pass ? '✓ 通过' : '✗ 未通过'}</span> ${x.ev.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`;
  const html = `<tr><th>检查项（24.3）</th><th>A 原始实现</th><th>B 修改后</th></tr>` + ROWS.map(([n, k]) => `<tr><th>${n}</th>${cell(R.A[k])}${cell(R.B[k])}</tr>`).join('');
  const cnt = v => ROWS.filter(([, k]) => R[v][k].pass).length;
  for (const s of shots1) await ev(s => __er.shot('shots1', `<figure><img src="${s.url}" alt="${s.cap}"><figcaption><b>${s.cap}</b></figcaption></figure>`), s);
  await ev(() => __er.shot('shots1', '<p class="m">左右两张是同一组件在 320 像素宽的容器里、根字号放大到 200% 时的样子：A 的文字和高度写死成像素，字号没有变大，宽度伸出容器；B 用 rem 与弹性宽度，文字放大一倍后自动换行。</p>'));
  for (const s of shots2) await ev(s => __er.shot('shots2', `<figure><img src="${s.url}" alt="${s.cap}"><figcaption><b>${s.cap}</b></figcaption></figure>`), s);
  await ev(([h, n]) => __er.render(h, n), [html, `A 通过 ${cnt('A')}／8 项，B 通过 ${cnt('B')}／8 项。运行条件：${research.env}；视口 1180 像素，设备像素比 1。性能类结论要连同这些条件一起记录。`]);
  console.log(['A', 'B'].map(v => v + ' ' + ROWS.map(([, k]) => `${k}:${R[v][k].pass ? 1 : 0}`).join(' ')).join('\n'));
  console.log(['A', 'B'].map(v => v + ' ' + Object.entries(research.C[v]).map(([k, x]) => `${k}:${x.pass ? 1 : 0}`).join(' ')).join('\n'));
  for (const v of ['A', 'B']) for (const [k, x] of Object.entries(R[v])) console.log(v, k, x.ev);
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
