// 18-05：对同一个组件连拍两张截图，交给页面逐像素比较；再检查主题 × 宽度与组件状态
module.exports = async page => {
  await page.waitForFunction(() => window.__vd);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.getElementById('stageWrap').classList.add('show'));
  const render = o => page.evaluate(o => window.__vd.render(o), o);
  const shot = async sel => (await page.locator(sel || '#card').screenshot({ animations: 'allow' })).toString('base64');
  const diff = (a, b, draw) => page.evaluate(([a, b, d]) => window.__vd.diff(a, b, d), [a, b, draw]);
  // 1 可复现条件
  const SC = [
    { name: '时间', what: '卡片上显示“更新于 时:分:秒”', how: '固定时钟', un: [{ seed: 1, anim: 'paused' }], ctl: [{ seed: 1, anim: 'paused', clock: 'fixed' }], rerender: true },
    { name: '随机', what: '头像颜色与标签顺序随机', how: '固定随机种子', un: [{ clock: 'fixed', anim: 'paused' }], ctl: [{ clock: 'fixed', anim: 'paused', seed: 1 }], rerender: true },
    { name: '动画', what: '“正在直播”的小圆点一直在闪', how: '暂停动画或打开“减少动态效果”', un: [{ clock: 'fixed', seed: 1 }], ctl: [{ clock: 'fixed', seed: 1, anim: 'paused' }], rerender: false },
    { name: '字体加载', what: '网页字体还没加载完就截图', how: '等 document.fonts.ready 之后再截', un: [{ clock: 'fixed', seed: 1, anim: 'paused', font: 'fallback' }, { clock: 'fixed', seed: 1, anim: 'paused' }], ctl: [{ clock: 'fixed', seed: 1, anim: 'paused' }], rerender: true }
  ];
  const rows = [], imgs = [];
  for (const s of SC) {
    const run = async (opts, draw) => { await render(opts[0]); const a = await shot(); await page.waitForTimeout(s.rerender ? 1100 : 450); if (s.rerender) await render(opts[1] || opts[0]); const b = await shot(); return diff(a, b, draw); };
    const u = await run(s.un, true), c = await run(s.ctl, false);
    rows.push({ ...s, u: u.n, us: u.size, c: c.n, cs: c.size }); imgs.push({ name: s.name, url: u.url });
  }
  // 2 主题 × 宽度
  const matrix = [], thumbs = [];
  for (const theme of ['light', 'dark']) for (const width of [320, 380]) {
    const base = { theme, width, clock: 'fixed', seed: 1, anim: 'paused' };
    await render(base); const a = await page.evaluate(() => window.__vd.inspect()); thumbs.push({ theme, width, b64: await shot() });
    await render({ ...base, fixed: true }); const b = await page.evaluate(() => window.__vd.inspect());
    matrix.push({ theme, width, a, b });
  }
  // 3 组件状态：默认、悬停、键盘焦点、禁用
  const states = [];
  for (const fixed of [false, true]) {
    const base = { clock: 'fixed', seed: 1, anim: 'paused', fixed };
    await render(base); await page.mouse.move(0, 0); const d0 = await shot('#card .buy');
    await page.hover('#card .buy'); const dh = await shot('#card .buy'); await page.mouse.move(0, 0);
    await page.evaluate(() => document.activeElement && document.activeElement.blur()); await page.keyboard.press('Tab'); const df = await shot('#card .foot');
    await page.evaluate(() => document.activeElement.blur()); const d0f = await shot('#card .foot');
    await render({ ...base, disabled: true }); await page.mouse.move(0, 0); const dd = await shot('#card .buy');
    states.push({ fixed, hover: (await diff(d0, dh)).n, focus: (await diff(d0f, df)).n, disabled: (await diff(d0, dd)).n, imgs: fixed ? null : [d0, dh, df, dd] });
  }
  await page.evaluate(() => document.getElementById('stageWrap').classList.remove('show'));
  // 写进页面
  const nm = { light: '浅色', dark: '深色' };
  await page.evaluate(([rows, imgs, matrix, thumbs, states]) => {
    const ok = (b, y = '✓', n = '✗') => b ? `<span class="good">${y}</span>` : `<span class="poor">${n}</span>`, nm = { light: '浅色', dark: '深色' };
    window.__vd.fill('diffs', imgs.map(i => `<figure><img src="${i.url}" alt="${i.name}不控制时两张截图的差异">${i.name}</figure>`).join(''));
    window.__vd.fill('repro', '<tr><th>变化来源</th><th>例子</th><th>不控制：两张截图不同的像素</th><th>控制方法</th><th>控制后</th></tr>' + rows.map(r => `<tr><th>${r.name}</th><td>${r.what}</td><td class="num poor">${r.u}${r.us ? `（尺寸也变了：${r.us}）` : ''}</td><td>${r.how}</td><td class="num ${r.c ? 'poor' : 'good'}">${r.c}</td></tr>`).join(''));
    window.__vd.fill('mrepro', '不控制这四样东西，截图比较每次都会报差异，真正的问题就淹没在噪声里。时间、随机、动画、字体都控制住以后，两次截图逐像素相同，任何差异都值得看一眼。');
    window.__vd.fill('matrix', thumbs.map(t => `<figure><img src="data:image/png;base64,${t.b64}" alt="" style="width:${t.width * 0.62}px">${nm[t.theme]} · ${t.width} 像素</figure>`).join(''));
    window.__vd.fill('bounds', '<tr><th>条件</th><th>超出内容边界</th><th>对比度不足 4.5</th><th>修正后</th></tr>' + matrix.map(m => `<tr><th>${nm[m.theme]} ${m.width}</th><td class="${m.a.overflow.length ? 'poor' : 'good'}">${m.a.overflow.join('、') || '无'}</td><td class="${m.a.low.length ? 'poor' : 'good'}">${m.a.low.join('、') || '无'}</td><td>${ok(!m.b.overflow.length && !m.b.low.length, '全部通过', '仍有问题')}</td></tr>`).join(''));
    window.__vd.fill('mbounds', '截图看得出“哪里不对”，但不一定看得出“为什么”。程序同时读布局与计算样式：320 像素宽时，价格和按钮各有最小宽度又不许换行，按钮伸出内容边界 26 像素，压到了卡片边上；深色主题下，“更新于”那行写死了深灰色，对比度只有 1.81。修正：底部允许换行、去掉最小宽度；深色主题用主题里的次要文字色。');
    window.__vd.fill('states', states[0].imgs.map((b, i) => `<figure><img src="data:image/png;base64,${b}" alt="">${['默认', '悬停', '键盘焦点', '禁用'][i]}</figure>`).join(''));
    window.__vd.fill('stateT', '<tr><th>状态</th><th>与默认相比不同的像素（原版）</th><th>修正后</th></tr>' + ['hover', 'focus', 'disabled'].map(k => `<tr><th>${{ hover: '悬停', focus: '键盘焦点', disabled: '禁用' }[k]}</th><td class="num ${states[0][k] < 30 ? 'poor' : ''}">${states[0][k]}${states[0][k] < 30 ? '：看不出来' : ''}</td><td class="num ${states[1][k] < 30 ? 'poor' : 'good'}">${states[1][k]}</td></tr>`).join(''));
    window.__vd.fill('mstates', '状态要在固定的条件下逐个截下来：悬停用真实的鼠标移上去，键盘焦点用真实的 Tab 键，禁用直接设属性。原版的禁用按钮和默认一模一样——用户会以为能点。修正后禁用改为灰色、鼠标显示禁止。');
  }, [rows, imgs, matrix, thumbs, states]);
  console.log(JSON.stringify({ repro: rows.map(r => [r.name, r.u, r.us, r.c]), matrix: matrix.map(m => [m.theme, m.width, m.a.overflow, m.a.low, m.b.overflow, m.b.low]), states: states.map(s => [s.fixed, s.hover, s.focus, s.disabled]) }));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
