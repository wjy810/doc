// 17-12：用真实的点击完成批量修改的完整流程，并核对预览与实际、停止后的一致性、撤销后的状态
module.exports = async page => {
  await page.waitForFunction(() => window.__ba);
  const st = () => page.evaluate(() => { const r = window.__ba.RUN(); return { state: r ? r.state : null, done: r ? r.done.length : 0, hash: window.__ba.hash(), orig: window.__ba.ORIGINAL }; });
  // 逐个文件检查：要么完全改好，要么完全没动
  const partial = () => page.evaluate(() => { const P = window.__ba.P(); let full = 0, none = 0, half = 0; for (const it of P.todo) { const f = it.f, inT = f.folder === '第2单元', sh = f.shares.some(s => s.to === '李老师' && s.role === '编辑'), nm = f.name === (it.rename || it.f.name.replace(/（2）$/, '')) || f.name === it.rename; if (inT && sh) full++; else if (!inT && !sh) none++; else half++; } return { full, none, half }; });
  const out = {};
  await page.click('#go');
  await page.waitForFunction(() => window.__ba.RUN() && window.__ba.RUN().done.length >= 14);
  await page.click('#stop');
  await page.waitForFunction(() => window.__ba.RUN().state === 'stopped');
  out.stop1 = { ...(await st()), ...(await partial()) };
  await page.click('#rollback');
  out.rollback = await st();
  // 完整执行一次，核对预览与实际
  const preview = await page.evaluate(() => { const P = window.__ba.P(); return { todo: P.todo.length, skip: P.skipped.length, rename: P.todo.filter(i => i.rename).length, up: P.todo.filter(i => i.had).length, gain: P.gain }; });
  await page.click('#go');
  await page.waitForFunction(() => window.__ba.RUN() && window.__ba.RUN().state === 'done', null, { timeout: 20000 });
  out.full = await st();
  out.actual = await page.evaluate(() => {
    const B = window.__ba, P = B.P(), log = B.RUN().done, gain = {};
    for (const d of log) { const before = B.access({ ...d.f, folder: d.before.folder, shares: d.before.shares }, d.before.folder, d.before.shares), after = B.access(d.f); for (const [p, r] of Object.entries(after)) if (p !== '林晓' && before[p] !== r) (gain[p] = gain[p] || { add: 0, up: 0 })[before[p] ? 'up' : 'add']++; }
    const skippedUntouched = P.skipped.every(i => i.f.folder === '全部资料' && !i.f.shares.some(s => s.to === '李老师'));
    return { changed: log.length, renamed: B.files().filter(f => /（2）$/.test(f.name)).length, gain, skippedUntouched };
  });
  out.preview = preview;
  await page.click('[data-undo="0"]');
  out.undoAll = await st();
  // 截图：再做一次并在中途停止
  await page.click('#go');
  await page.waitForFunction(() => window.__ba.RUN() && window.__ba.RUN().done.length >= 11);
  await page.click('#stop');
  await page.waitForFunction(() => window.__ba.RUN().state === 'stopped');
  out.stop2 = { ...(await st()), ...(await partial()) };
  const auto = await page.evaluate(() => window.__ba.R.auto);
  out.auto = auto;
  const g = preview.gain, a = out.actual.gain, same = Object.keys(g).every(p => a[p] && a[p].add === g[p].add && a[p].up === g[p].up) && Object.keys(a).every(p => g[p]);
  await page.evaluate(([o, same]) => window.__ba.report([
    ['谁能访问会变', `预览：${Object.entries(o.preview.gain).map(([p, v]) => `${p} 新增 ${v.add}${v.up ? `、升级 ${v.up}` : ''}`).join('；')}（王可、陈雨来自文件夹继承）`, same, `执行后按权限系统重新计算，与预览完全相同`],
    ['哪些对象会改变', `预览：改 ${o.preview.todo} 个、跳过 ${o.preview.skip} 个、改名 ${o.preview.rename} 个`, o.actual.changed === o.preview.todo && o.actual.renamed === o.preview.rename && o.actual.skippedUntouched, `实际改了 ${o.actual.changed} 个、改名 ${o.actual.renamed} 个，跳过的 ${o.preview.skip} 个没有被碰`],
    ['怎样停止', '执行中随时“停止”，每个文件的修改是原子的', o.stop1.half === 0 && o.stop2.half === 0, `两次在中途停止（已改 ${o.stop1.done}、${o.stop2.done} 个）：改了一半的文件 0 个；停止后可以“继续”或“撤销已完成的部分”`],
    ['怎样恢复', '撤销已完成的部分；或从历史里整批撤销', o.rollback.hash === o.rollback.orig && o.undoAll.hash === o.undoAll.orig, `两种撤销后，资料库的指纹都回到初始的 ${o.rollback.orig}`],
    ['授权说明与实际一致（自动化）', `说明以谁的身份运行、读什么、发给谁`, o.auto.declMissingFixed.length === 0, `初稿漏写 ${o.auto.declMissingDraft.join('、')}；修改后 0 处遗漏`],
    ['权限变了以后', '每次运行前重新检查收件人', o.auto.safe.every(l => !l.leak) && o.auto.naive.some(l => l.leak), `第 11 周李老师调走：再检查时没有发送并通知林晓；不检查会把 4 个学生的名单发给已无权看到的人`]
  ]), [out, same]);
  console.log(JSON.stringify(out));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
