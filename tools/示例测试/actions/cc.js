// 12-07：改变条件 → 预览建议 → 应用；锁定 → 拒绝 → 同样的建议不再提出；自动应用；接管与手动调整；撤销；恢复被拒绝的建议
module.exports = async page => {
  const r = await page.evaluate(() => {
    const c = window.__cc, st = c.st, out = [];
    const caps = (w, h) => { const x = st.caps.slice(); x[w] = h; return x; };
    out.push(['start', c.finish(st.P)]);
    c.changeCondition('第 4 周出差，只有 2 小时', caps(3, 2), { ...st.locks }); out.push(['s1 moved', st.preview && st.preview.moved.join(','), c.finish(st.preview.P)]);
    document.getElementById('apply').click(); out.push(['applied', c.finish(st.P)]);
    c.changeCondition('日历同步：第 6 周有考试，只有 3 小时', caps(5, 3), { ...st.locks }, '系统'); out.push(['s2 moved', st.preview && st.preview.moved.join(','), c.finish(st.preview.P)]);
    document.getElementById('reject').click();
    c.changeCondition('日历再次同步：第 6 周只有 3 小时', caps(5, 3), { ...st.locks }, '系统'); out.push(['s3 preview?', !!st.preview]);
    c.changeCondition('锁定“交互与动画”在第 8 周开始', st.caps.slice(), { ...st.locks, T6: 7 }); out.push(['lock moved', st.preview && st.preview.moved.join(','), st.preview && c.finish(st.preview.P)]);
    if (!st.preview) return { out, log: c.logRows, cmp: c.cmp };
    document.getElementById('apply').click();
    c.setMode('auto'); c.changeCondition('第 10 周只有 6 小时', caps(9, 6), { ...st.locks }); out.push(['auto', c.finish(st.P)]);
    c.setMode('preview'); c.changeCondition('第 7 周没有时间', caps(6, 0), { ...st.locks });
    if (!document.getElementById('takeover')) return { out: [...out, ['no takeover', !!st.preview, st.paused]], log: c.logRows, cmp: c.cmp };
    document.getElementById('takeover').click();
    c.manualMove('T6', c.firstWeek(st.P.T6), c.firstWeek(st.P.T6) + 1, 2);
    c.resume(); out.push(['after resume preview', st.preview && st.preview.moved.join(',')]);
    if (!st.preview) return { out, log: c.logRows, cmp: c.cmp };
    document.getElementById('apply').click();
    c.undo();
    c.restoreRejected(); out.push(['restored', st.preview && st.preview.moved.join(','), st.preview && c.finish(st.preview.P), c.finish(st.P)]);
    return { out, log: c.logRows, cmp: c.cmp };
  });
  console.log(JSON.stringify(r.out)); for (const l of r.log) console.log(l.join(' | ')); console.log(JSON.stringify(r.cmp));
};
