// 21-05 项目 04：用鼠标和键盘检查初版与系统组件的各个状态，结果写回页面
module.exports = async page => {
  const R = {}, ev = (f, a) => page.evaluate(f, a);
  const clicks = id => ev(id => window.__ds.CLICKS[id], id);
  for (const v of ['A', 'B']) {
    const p = v === 'A' ? '#a-' : '#b-', r = {};
    // Tab 键：从页面开头按到组件为止
    await ev(() => { document.activeElement?.blur(); });
    let reached = false, reachedDis = false;
    for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); const id = await ev(() => document.activeElement?.id || ''); if ('#' + id === p + 'btn') reached = true; if ('#' + id === p + 'btn-dis') reachedDis = true; if (id === 'b-inp-err') break; }
    r.tab = { ok: reached, text: reached ? '能' : '不能（不是可聚焦元素）' };
    // 焦点可见与 Enter
    if (reached) {
      await page.focus(p + 'btn'); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
      const vis = await ev(sel => { const cs = getComputedStyle(document.querySelector(sel)); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0; }, p + 'btn');
      r.focus = { ok: vis, text: vis ? '有焦点框' : '看不到焦点' };
      const before = await clicks(p.slice(1) + 'btn'); await page.keyboard.press('Enter'); const after = await clicks(p.slice(1) + 'btn');
      r.enter = { ok: after - before === 1, text: `触发 ${after - before} 次` };
    } else { r.focus = { ok: false, text: '无法聚焦' }; r.enter = { ok: false, text: '无法用键盘操作' }; }
    // 悬浮
    const bg0 = await ev(sel => getComputedStyle(document.querySelector(sel)).backgroundColor, p + 'btn');
    await page.hover(p + 'btn'); await page.waitForTimeout(50);
    const bg1 = await ev(sel => getComputedStyle(document.querySelector(sel)).backgroundColor, p + 'btn');
    await page.mouse.move(0, 0);
    r.hover = { ok: bg0 !== bg1, text: bg0 !== bg1 ? '有变化' : '没有变化' };
    // 禁用
    const d0 = await clicks(p.slice(1) + 'btn-dis'); await page.click(p + 'btn-dis', { force: true }); const d1 = await clicks(p.slice(1) + 'btn-dis');
    r.disabled = { ok: d1 === d0 && !reachedDis, text: `点击触发 ${d1 - d0} 次；${reachedDis ? 'Tab 会停在上面' : 'Tab 跳过'}` };
    // 加载
    const name = await ev(sel => { const el = document.querySelector(sel); return (el.getAttribute('aria-label') || el.textContent).trim(); }, p + 'btn-load');
    r.loadName = { ok: name.length > 0, text: name ? `“${name}”` : '空（只有一个转圈图形）' };
    const l0 = await clicks(p.slice(1) + 'btn-load'); await page.click(p + 'btn-load', { force: true }); await page.click(p + 'btn-load', { force: true }); const l1 = await clicks(p.slice(1) + 'btn-load');
    r.loadClick = { ok: l1 === l0, text: `连点 2 次，触发 ${l1 - l0} 次` };
    // 输入框
    const lab = await ev(sel => { const el = document.querySelector(sel); return el.labels?.length ? el.labels[0].textContent : ''; }, p + 'inp');
    r.label = { ok: !!lab, text: lab ? `“${lab}”` : '没有（只有占位文字，输入后消失）' };
    const err = await ev(sel => { const el = document.querySelector(sel), d = el.getAttribute('aria-describedby'); return { inv: el.getAttribute('aria-invalid') === 'true', msg: d ? document.getElementById(d)?.textContent : '' }; }, p + 'inp-err');
    r.error = { ok: err.inv && !!err.msg, text: err.inv ? `aria-invalid，说明：“${err.msg}”` : '只有红色边框，没有关联说明' };
    // 对比度（禁用状态按 WCAG 豁免，不计入）
    const c = await ev(pre => { const bgOf = el => { for (let e = el; e; e = e.parentElement) { const b = getComputedStyle(e).backgroundColor; if (!/rgba\(0, 0, 0, 0\)/.test(b)) return b; } return 'rgb(255, 255, 255)'; }; return ['btn', 'btn-load', 'inp', 'inp-err'].map(k => { const el = document.querySelector(pre + k); return window.__ds.cr(getComputedStyle(el).color, bgOf(el)); }); }, p);
    const min = Math.min(...c);
    r.contrast = { ok: min >= 4.5, text: min.toFixed(2) + ' : 1' };
    R[v] = r;
  }
  const aria = (await Promise.all(['#b-btn', '#b-btn-dis', '#b-btn-load', '#b-inp', '#b-inp-err'].map(s => page.locator(s).ariaSnapshot()))).join('\n');
  await ev(([R, aria]) => window.__ds.fill(R, aria), [R, aria]);
  console.log(JSON.stringify(R)); console.log(aria);
  console.log(JSON.stringify(await ev(() => ({ audit: window.__ds.audited, lint: window.__ds.lint }))));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
};
