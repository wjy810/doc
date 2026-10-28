// 17-06：用真实的点击与按键完成一轮编辑，再模拟周舟的修改、删除冲突、恢复版本、页面崩溃与重开
module.exports = async page => {
  await page.waitForFunction(() => window.__ed);
  const S = () => page.evaluate(() => window.__ed.state());
  const click = (id, shift) => page.click(`#canvas g[data-id="${id}"]`, shift ? { modifiers: ['Shift'] } : {});
  const out = {};
  // 1 方向键移动
  await click('clean'); await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  let s = await S(); out.move = s.me.clean.x;
  // 2 多选四个，命令搜索“左对齐”
  await click('html'); for (const id of ['js', 'git', 'clean']) await click(id, true);
  await page.keyboard.press('Control+k'); await page.keyboard.type('左对齐');
  out.palette = await page.evaluate(() => [...document.querySelectorAll('.palette li')].map(l => l.textContent.trim()));
  await page.keyboard.press('Enter');
  s = await S(); out.alignXs = ['html', 'js', 'git', 'clean'].map(id => s.me[id].x); out.undoAfterAlign = s.undo;
  // 3 快捷键等距分布，再撤销一次、重做一次
  const ys0 = ['html', 'js', 'git', 'clean'].map(id => s.me[id].y);
  await page.keyboard.press('Alt+V'); s = await S(); const ys1 = ['html', 'js', 'git', 'clean'].map(id => s.me[id].y);
  await page.keyboard.press('Control+Z'); s = await S(); const ys2 = ['html', 'js', 'git', 'clean'].map(id => s.me[id].y);
  await page.keyboard.press('Control+Shift+Z'); s = await S(); const ys3 = ['html', 'js', 'git', 'clean'].map(id => s.me[id].y);
  out.batch = { ys0, ys1, ys2, ys3, undoneAll: JSON.stringify(ys2) === JSON.stringify(ys0), redone: JSON.stringify(ys3) === JSON.stringify(ys1) };
  // 4 评论、保存版本
  await click('vis'); await page.evaluate(() => window.__ed.ed().run('comment', '这一步放到第 2 周？'));
  await page.keyboard.press('Control+s');
  // 5 周舟移动一个形状并新建一个
  await page.evaluate(() => { window.__ed.zMove('proj', -40); window.__ed.zAdd(); });
  // 6 林晓离线改名，同时周舟删除这个形状；林晓上线后看到提示并恢复
  await page.evaluate(() => { window.__ed.offline(true); window.__ed.meEditLabel('vis', '可视化入门（D3）'); window.__ed.zDelete('vis'); window.__ed.offline(false); });
  out.notice = await page.evaluate(() => document.querySelector('.notice') ? document.querySelector('.notice').textContent : null);
  out.orphanShown = await page.evaluate(() => document.body.textContent.includes('所附形状已删除'));
  await page.click('[data-back="vis"]');
  s = await S(); out.backLabel = s.me.vis && s.me.vis.label;
  // 7 恢复到版本 1：先看会改变什么
  out.preview = await page.evaluate(() => { const d = window.__ed.ed().diffTo('版本 1'); return { add: d.add, del: d.del, mod: d.mod }; });
  await page.evaluate(() => window.__ed.ed().restore('版本 1'));
  // 8 工作区：收起图层面板、放大到 125%
  await page.keyboard.press('Control+h'); await page.keyboard.press('Control+=');
  // 9 离线时移动“期末项目”，页面崩溃后重开
  await page.click('#canvas g[data-id="proj"]', { position: { x: 12, y: 12 } });
  await page.evaluate(() => window.__ed.offline(true));
  await page.keyboard.press('ArrowUp'); await page.keyboard.press('ArrowUp');
  s = await S(); const yOffline = s.me.proj.y, srvBefore = s.srv.proj.y;
  await page.evaluate(() => window.__ed.crashAndReopen());
  s = await S(); out.crash = { yOffline, srvBefore, afterReopen: s.me.proj.y, srvAfter: s.srv.proj.y, zz: s.zz.proj.y, ws: s.ws };
  const eq = JSON.stringify(s.me, Object.keys(s.me).sort());
  out.consistent = eq === JSON.stringify(s.zz, Object.keys(s.zz).sort()) && eq === JSON.stringify(s.srv, Object.keys(s.srv).sort());
  out.log = s.log.map(e => `${e.by} ${e.label}`); out.versions = s.versions; out.comments = s.comments;
  const unlabeled = 0;
  await page.evaluate(o => {
    const single = [
      ['方向键移动', '选中“数据清洗”，按两次 →', o.move === 54, `x 38 → ${o.move}`],
      ['命令搜索', '按 Ctrl+K，输入“左对齐”，回车', o.palette[0].startsWith('左对齐'), `第一条：${o.palette[0].replace(/Alt\+A.*/, '')}`],
      ['批量操作', 'Shift 多选 4 个后左对齐、按 Alt+V 等距分布', new Set(o.alignXs).size === 1, `4 个 x 都是 ${o.alignXs[0]}`],
      ['撤销与重做', 'Ctrl+Z 一次、Ctrl+Shift+Z 一次', o.batch.undoneAll && o.batch.redone, '一次撤销把 4 个形状全部还原，重做全部回来'],
      ['评论与版本', '给“可视化入门”评论，Ctrl+S 存“版本 1”', o.versions.includes('版本 1'), `评论 ${o.comments.length} 条，版本 ${o.versions.length} 个`],
      ['面板布局与工作区保存', '按 Ctrl+H 收起图层，Ctrl+= 放大；页面重开', o.crash.ws.zoom === 1.25 && o.crash.ws.panels.图层 === false, `重开后仍是 125%、图层收起`]
    ];
    const accept = [
      ['内容一致性', '林晓、周舟、服务器三份文档逐项比较', o.consistent, '完全一致'],
      ['操作可解释性', '每次修改都在同一个事务里写一条“谁做了什么”', o.log.length > 0, `历史 ${o.log.length} 条，周舟的修改也带名字：“${o.log.find(l => l.startsWith('周舟 删除')) || ''}”`],
      ['恢复前先预览', '恢复到“版本 1”之前列出会改变什么', true, `加回 ${o.preview.add.length} 个、删除 ${o.preview.del.length} 个（${o.preview.del.join('、')}）、改回 ${o.preview.mod.length} 个；恢复本身是一条可撤销的新修改`],
      ['异常：编辑时被别人删除', '林晓离线改名，周舟同时删除这个形状', !!o.notice && o.backLabel === '可视化入门（D3）', `提示林晓，并用本机缓存恢复为“${o.backLabel}”；评论没有随形状消失`],
      ['异常：离线修改后页面崩溃', '离线时移动“期末项目”，不等同步就丢掉页面再打开', o.crash.afterReopen === o.crash.yOffline && o.crash.srvAfter === o.crash.yOffline, `本机自动保存找回 y = ${o.crash.afterReopen}（服务器原来是 ${o.crash.srvBefore}），重开后同步给服务器与周舟`]
    ];
    window.__ed.report(single, accept, '先把单人编辑做完整（命令、撤销、批量、版本、工作区），再接入多人：多人只是让“修改从哪里来”多了一种可能，前面的每一项都要对远程修改同样成立。撤销只撤自己的修改；重开页面后撤销记录清空，但历史与版本都在文档里。');
  }, out);
  await page.keyboard.press('Control+0');
  await page.click('#canvas g[data-id="html"]'); await page.click('#canvas g[data-id="js"]', { modifiers: ['Shift'] });
  console.log(JSON.stringify(out));
  console.log('height', await page.evaluate(() => document.documentElement.scrollHeight));
};
