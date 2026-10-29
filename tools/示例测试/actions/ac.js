// 18-09 验收检查：对 A、B 两个报名组件执行同一组检查（视觉与内容 5 项、交互与流程 9 项）
const sleep = ms => new Promise(r => setTimeout(r, ms));
module.exports = async page => {
  const R = { A: {}, B: {} }, shots = [];
  const ev = (fn, arg) => page.evaluate(fn, arg);
  for (const v of ['A', 'B']) {
    const w = () => page.locator('#w' + v), r = R[v];
    const tabTo = async (sel, max = 12) => { for (let i = 0; i <= max; i++) { if (await ev(s => !!document.activeElement && document.activeElement.matches(s), sel)) return i; if (i < max) await page.keyboard.press('Tab'); } return -1; };

    // ---- 交互：主要任务完整（鼠标），同时收集每一步的文字 ----
    await ev(v => __ac.reset(v), v);
    const texts = [];
    await w().locator('[data-tab="晚班"]').click(); await sleep(300); texts.push(await w().innerText());
    await w().locator('[data-opt]').first().click();
    await w().locator('[data-go="2"]').click();
    await w().locator('[data-k="name"]').fill('林同学'); await w().locator('[data-k="phone"]').fill('13800000000'); texts.push(await w().innerText());
    await w().locator('[data-go="3"]').click(); texts.push(await w().innerText());
    await w().locator('[data-submit]').click(); await sleep(600); texts.push(await w().innerText());
    const done = /订单号 \d+/.test(texts[3]);
    r.flow = { pass: done, ev: done ? '选班次 → 填信息 → 提交，得到订单号' : '没有到达结果页' };
    const all = texts.join('\n'), terms = ['报名', '注册', '报读'].filter(x => all.includes(x));
    r.terms = { pass: terms.length === 1, ev: `流程里出现 ${terms.map(x => `“${x}”`).join('、')}` };

    // ---- 视觉：主要操作、文字层级、选中状态 ----
    await ev(v => __ac.reset(v), v);
    const pr = await ev(v => { const el = document.querySelector('#w' + v), btns = [...el.querySelectorAll('.card button')], main = getComputedStyle(btns[0]).backgroundColor; return btns.filter(b => getComputedStyle(b).backgroundColor === main).map(b => b.getAttribute('aria-label') || b.textContent.trim()); }, v);
    r.primary = { pass: pr.length === 1, ev: pr.length === 1 ? `只有“${pr[0]}”是强调样式` : `${pr.length} 个按钮同样醒目：${pr.join('、')}` };
    const lv = await ev(v => { const el = document.querySelector('#w' + v); return ['.title', '.price', '.desc', '.note'].map(q => { const c = getComputedStyle(el.querySelector(q)); return `${parseFloat(c.fontSize)}/${c.fontWeight}`; }); }, v);
    const nl = new Set(lv).size;
    r.levels = { pass: nl >= 3, ev: `标题、价格、介绍、注释的字号／字重：${lv.join('、')}（${nl} 级）` };
    await w().locator('[data-tab="晚班"]').click(); await sleep(300); await w().locator('[data-opt]').first().click();
    const sel = await ev(v => { const o = document.querySelector(`#w${v} .opt.sel`); return { mark: getComputedStyle(o, '::after').content, aria: o.getAttribute('aria-checked') }; }, v);
    const selOk = sel.mark !== 'none' && sel.aria === 'true';
    r.selected = { pass: selOk, ev: selOk ? `选中项有“${sel.mark.replace(/"/g, '')}”文字，并标注 aria-checked` : '选中项只靠边框颜色区分，读屏软件也不知道哪个被选中' };

    // ---- 视觉：极端内容 ＋ 深色主题 ----
    await ev(v => __ac.stress(v), v); await sleep(300);
    shots.push({ v, kind: '极端内容＋深色主题', url: 'data:image/png;base64,' + (await w().screenshot()).toString('base64') });
    const ex = await ev(v => {
      const el = document.querySelector('#w' + v), card = el.querySelector('.card'), cr = card.getBoundingClientRect(), out = [];
      for (const n of card.querySelectorAll('*')) { const b = n.getBoundingClientRect(); if (b.width && b.right > cr.right + 0.5) out.push({ title: '标题', price: '价格', desc: '介绍', note: '注释', acts: '按钮行', cover: '封面', more: '课程说明' }[n.className.split(' ')[0]] || n.tagName.toLowerCase()); }
      const img = el.querySelector('img.cover');
      return { out: [...new Set(out)], broken: !!img && img.complete && img.naturalWidth === 0, empty: !el.querySelector('.desc').textContent.trim() };
    }, v);
    const exIssues = [...(ex.out.length ? [`${ex.out.join('、')} 伸出卡片`] : []), ...(ex.broken ? ['图片失效后显示破图'] : []), ...(ex.empty ? ['没有介绍时留下空白'] : [])];
    r.extreme = { pass: !exIssues.length, ev: exIssues.length ? exIssues.join('；') : '长标题截成两行、长价格可换行、失效图片换成占位、空介绍有提示' };
    const lc = await ev(v => {
      const lin = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }, L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]), rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
      const bgOf = e => { for (let n = e; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.length < 4 || c[3] > 0) return c.slice(0, 3); } return [255, 255, 255]; };
      const bad = []; let min = 99;
      for (const e of document.querySelectorAll(`#w${v} .title, #w${v} .price, #w${v} .desc, #w${v} .note, #w${v} .steps, #w${v} button:not(:disabled), #w${v} a, #w${v} .opts .loading`)) {
        if (!e.textContent.trim()) continue;
        const f = rgb(getComputedStyle(e).color), b = bgOf(e), cr = (Math.max(L(f), L(b)) + 0.05) / (Math.min(L(f), L(b)) + 0.05);
        min = Math.min(min, cr); if (cr < 4.5) bad.push(`${e.className || e.tagName.toLowerCase()} ${cr.toFixed(2)}`);
      }
      return { bad: [...new Set(bad)], min };
    }, v);
    r.dark = { pass: !lc.bad.length, ev: lc.bad.length ? `对比度不足 4.5：${lc.bad.join('、')}` : `最低对比度 ${lc.min.toFixed(2)}` };

    // ---- 交互：失败状态 ----
    await ev(v => { __ac.jump(v, 3); __ac.SERVER.mode = 'fail'; }, v);
    await w().locator('[data-submit]').click(); await sleep(900);
    shots.push({ v, kind: '提交失败 0.9 秒后', url: 'data:image/png;base64,' + (await w().screenshot()).toString('base64') });
    const fs = await ev(v => { const el = document.querySelector('#w' + v), b = el.querySelector('.row [data-submit]'); return { retry: !!el.querySelector('.msg [data-submit]'), stuck: !!b && b.textContent.includes('提交中'), msg: (el.querySelector('.msg') || {}).textContent || '' }; }, v);
    let retried = false;
    if (fs.retry) { await ev(() => { __ac.SERVER.mode = 'ok'; }); await w().locator('.msg [data-submit]').click(); await sleep(600); retried = /订单号/.test(await w().innerText()); }
    await ev(() => { __ac.SERVER.mode = 'ok'; });
    r.fail = { pass: fs.retry && !fs.stuck && retried, ev: fs.stuck ? '按钮一直显示“提交中…”，没有说明，无法重试' : `显示“${fs.msg.split('。')[0]}”，有“重试”和“返回修改”${retried ? '；重试后成功' : ''}` };

    // ---- 交互：重复点击 ----
    await ev(v => { __ac.jump(v, 3); __ac.SERVER.log.length = 0; }, v);
    await w().locator('[data-submit]').dblclick(); await sleep(800);
    const n = await ev(v => __ac.SERVER.log.filter(x => x.ver === v && x.path === '/orders').length, v);
    r.double = { pass: n === 1, ev: `双击“提交”产生 ${n} 个下单请求` + (n === 1 ? '（提交中按钮不可用）' : '') };

    // ---- 交互：快速切换 ----
    await ev(v => __ac.reset(v), v);
    await w().locator('[data-tab="周末班"]').click(); await w().locator('[data-tab="晚班"]').click(); await sleep(900);
    const sw = await ev(v => { const el = document.querySelector('#w' + v); return { tab: (el.querySelector('[aria-selected="true"]') || {}).textContent, opts: [...el.querySelectorAll('[data-opt]')].map(o => o.dataset.opt) }; }, v);
    const swOk = sw.tab === '晚班' && sw.opts[0] && sw.opts[0].startsWith('周二');
    r.switch = { pass: swOk, ev: `先点周末班（600 毫秒返回）再点晚班（150 毫秒返回）：标签是“${sw.tab}”，列表是“${sw.opts.join('、')}”` };

    // ---- 交互：中途退出后恢复 ----
    await ev(v => __ac.reset(v), v);
    await w().locator('[data-tab="晚班"]').click(); await sleep(300); await w().locator('[data-opt]').first().click(); await w().locator('[data-go="2"]').click();
    await w().locator('[data-k="name"]').fill('林同学');
    await ev(v => __ac.remount(v), v);
    const rs = await ev(v => { const el = document.querySelector('#w' + v); return { step: __ac.W[v].step, name: (el.querySelector('[data-k="name"]') || {}).value || '', msg: (el.querySelector('.msg') || {}).textContent || '' }; }, v);
    r.resume = { pass: rs.step === 2 && rs.name === '林同学', ev: rs.step === 2 ? `重新进入回到第 2 步，姓名已恢复，提示“${rs.msg}”` : `重新进入回到第 ${rs.step} 步，已填写的内容丢失` };

    // ---- 交互：只用键盘 ----
    await ev(v => __ac.reset(v), v);
    await w().locator('[data-tab="晚班"]').focus(); await page.keyboard.press('Enter'); await sleep(300);
    const lost = await ev(() => document.activeElement === document.body);
    let tabs = 0, fail = '';
    const step = async (sel, key, what) => { if (fail) return; const k = await tabTo(`#w${v} ${sel}`); if (k < 0) { fail = `按 Tab 到不了“${what}”`; return; } tabs += k; if (key) await page.keyboard.press(key); await sleep(120); };
    await step('[data-opt]', 'Space', '班次选项');
    await step('[data-go="2"]:not(:disabled)', 'Enter', '下一步');
    await step('[data-k="name"]', null, '姓名'); if (!fail) await page.keyboard.type('林同学');
    await step('[data-k="phone"]', null, '手机号'); if (!fail) await page.keyboard.type('13800000000');
    await step('[data-go="3"]', 'Enter', '下一步');
    await step('[data-submit]', 'Enter', '提交'); await sleep(600);
    const kOk = !fail && /订单号/.test(await w().innerText());
    r.keyboard = { pass: kOk, ev: kOk ? `共按 ${tabs} 次 Tab 完成，重新渲染后焦点留在原控件上` : `${lost ? '按 Enter 后列表重新渲染，焦点丢失；' : ''}${fail || '没有完成'}` };

    // ---- 交互：弹窗焦点与返回；触控目标尺寸 ----
    await ev(v => __ac.reset(v), v);
    await w().locator('a.more').click(); await sleep(150);
    const d1 = await ev(v => { const box = document.querySelector(`#w${v} dialog, #w${v} .overlay`); return !!box && box.contains(document.activeElement); }, v);
    const small = await ev(v => [...document.querySelectorAll(`#w${v} button, #w${v} a, #w${v} input`)].map(e => { const b = e.getBoundingClientRect(); return { n: e.getAttribute('aria-label') || e.textContent.trim(), w: b.width, h: b.height }; }).filter(x => x.w > 0 && (x.w < 24 || x.h < 24)).map(x => `${x.n} ${Math.round(x.w)}×${Math.round(x.h)}`), v);
    await page.keyboard.press('Escape'); await sleep(150);
    const d2 = await ev(v => ({ open: !!document.querySelector(`#w${v} dialog[open], #w${v} .overlay`), back: document.activeElement === document.querySelector(`#w${v} a.more`) }), v);
    r.dialog = { pass: d1 && !d2.open && d2.back, ev: `打开后焦点${d1 ? '进入弹窗' : '留在弹窗外'}；Esc ${d2.open ? '关不掉' : '关闭'}；关闭后焦点${d2.back ? '回到“课程说明”' : '没有回到触发处'}` };
    r.targets = { pass: !small.length, ev: small.length ? `小于 24×24：${small.join('、')}` : '弹窗打开时所有可点元素都不小于 24×24' };
    await ev(v => __ac.reset(v), v);
  }
  // ---- 汇总 ----
  const ROWS = [
    ['24.1 视觉与内容', null],
    ['主要操作容易辨认', 'primary'], ['标题、正文、注释和数值层级清楚', 'levels'], ['长标题、长数字、空内容、失效图片正常呈现', 'extreme'], ['深色主题下可读（文字对比度 ≥ 4.5）', 'dark'], ['术语一致', 'terms'],
    ['24.2 交互与流程', null],
    ['从入口到结果的主要任务完整', 'flow'], ['失败有说明、能重试或返回', 'fail'], ['重复点击不造成重复提交', 'double'], ['快速切换不显示过期结果', 'switch'], ['中途退出后能恢复并说明进度', 'resume'], ['选中对象清楚可见（不只靠颜色）', 'selected'], ['只用键盘能完成主要任务', 'keyboard'], ['弹窗的焦点、关闭与返回位置合理', 'dialog'], ['触控目标不小于 24×24 像素', 'targets']
  ];
  const cell = x => `<td><span class="${x.pass ? 'good' : 'poor'}">${x.pass ? '✓ 通过' : '✗ 未通过'}</span> ${x.ev.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</td>`;
  const html = `<tr><th>检查项</th><th>A 原始实现</th><th>B 修改后</th></tr>` + ROWS.map(([n, k]) => k ? `<tr><th>${n}</th>${cell(R.A[k])}${cell(R.B[k])}</tr>` : `<tr><td class="sec" colspan="3">${n}</td></tr>`).join('');
  const cnt = v => ROWS.filter(([, k]) => k && R[v][k].pass).length, tot = ROWS.filter(([, k]) => k).length;
  for (const s of shots) await ev(s => __ac.shot(`<figure><img src="${s.url}" alt="${s.v} 版：${s.kind}"><figcaption><b>${s.v} · ${s.kind}</b></figcaption></figure>`), s);
  await ev(([h, n]) => __ac.render(h, n), [html, `A 通过 ${cnt('A')}／${tot} 项，B 通过 ${cnt('B')}／${tot} 项。脚本检查不了的项目仍要人来看：分组、对齐与间距是否符合内容关系；颜色角色、图标风格与图片处理是否协调；页面实际内容与所需的视觉风格是否匹配；文案是否说清了下一步。`]);
  console.log(['A', 'B'].map(v => v + ' ' + ROWS.filter(([, k]) => k).map(([, k]) => `${k}:${R[v][k].pass ? 1 : 0}`).join(' ')).join('\n'));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
