// 19-11 自动布局编辑器：冲突、长文本、导出，并在导出页里换更长的标题
module.exports = async page => {
  const r = await page.evaluate(async () => {
    await document.fonts.ready;
    const LONG = '数据可视化入门：从表格到交互图表', LONGER = '数据可视化入门：从表格、统计图到可交互的地图与网络图';
    const out = {};
    for (const v of ['A', 'B']) {
      const m = __al.model(), issues = [];
      // 1 冲突：按钮固定宽度 300
      __al.find(m, 'btn').w = { m: 'fixed', v: 300 };
      let L = __al.solve(m, v, issues), d = __al.draw(document.getElementById('e' + v), m, L);
      const conflict = { over: d.over, issues: issues.slice() };
      // 用户按提示改成“填满”（A 没有提示，保持原样）
      if (v === 'B') __al.find(m, 'btn').w = { m: 'hug' };
      // 2 长文本
      __al.find(m, 'title').text = LONG;
      issues.length = 0; L = __al.solve(m, v, issues); d = __al.draw(document.getElementById('e' + v), m, L);
      const long = { clipped: d.clipped, over: d.over, h: L.card.h };
      __al.text('m' + v, v === 'B' ? (conflict.issues[0] ? '提示：' + conflict.issues[0] : '') : '');
      // 3 导出：先用同样的标题，比较导出页与编辑器的位置
      const ex = v === 'A' ? __al.exportA(m, L) : __al.exportB(m), sh = __al.mountExport(document.getElementById('x' + v), ex);
      await new Promise(r => requestAnimationFrame(r));
      const base = document.getElementById('x' + v).getBoundingClientRect(), wrap = sh.querySelector('.wrap').getBoundingClientRect();
      let diff = 0; const dd = {}; for (const id of ['card', 'img', 'title', 'meta', 'price', 'btn']) { const b = sh.getElementById(id).getBoundingClientRect(), e = L[id]; dd[id] = [Math.round(b.left - wrap.left - e.x), Math.round(b.top - wrap.top - e.y), Math.round(b.width - e.w)]; diff = Math.max(diff, Math.abs(b.left - wrap.left - e.x), Math.abs(b.top - wrap.top - e.y)); } out['dd' + v] = dd;
      // 4 内容更新：导出页里换成更长的标题
      sh.getElementById('title').textContent = LONGER; await new Promise(r => requestAnimationFrame(r));
      const ov = __al.overlaps(sh);
      document.getElementById('c' + v).textContent = `${v} 导出的样式（节选）\n` + ex.css.split('\n').filter(l => /^#(card|title|row)\{/.test(l)).join('\n');
      out[v] = { conflict, long, diff, ov };
    }
    return out;
  });
  console.log(JSON.stringify(r));
  await page.evaluate(r => {
    const c = (ok, t) => `<td class="${ok ? 'good' : 'poor'}">${t}</td>`;
    __al.fill('res', `<tr><th>检查</th><th>A</th><th>B</th></tr>`
      + `<tr><th>冲突：按钮固定宽度 300，卡片只有 240</th>${c(false, `按钮伸出卡片（${r.A.conflict.over.join('、')}），没有任何提示`)}${c(r.B.conflict.issues.length, `给出原因与两种改法：${r.B.conflict.issues[0]}`)}</tr>`
      + `<tr><th>长文本：标题换成 16 个字</th>${c(!r.A.long.clipped.length, `标题固定一行高，被裁掉（${r.A.long.clipped.join('、')}）`)}${c(!r.B.long.clipped.length, `标题自动换成两行，卡片跟着变高到 ${Math.round(r.B.long.h)} 像素，没有裁切`)}</tr>`
      + `<tr><th>导出：与编辑器的位置差</th><td class="num">${r.A.diff.toFixed(1)} 像素</td><td class="num">${r.B.diff.toFixed(1)} 像素</td></tr>`
      + `<tr><th>导出后换更长的标题</th>${c(!r.A.ov.bad.length && !r.A.ov.out.length, `重叠：${r.A.ov.bad.join('、') || '无'}；伸出卡片：${r.A.ov.out.join('、') || '无'}（位置是写死的）`)}${c(!r.B.ov.bad.length && !r.B.ov.out.length, `重叠：${r.B.ov.bad.join('、') || '无'}；伸出卡片：${r.B.ov.out.join('、') || '无'}（弹性布局跟着内容重新排）`)}</tr>`);
  }, r);
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
