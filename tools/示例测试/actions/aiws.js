// 21-12 项目 11：取消、进度、来源、三类标签、编造的说法、修改与版本、纠错、导出
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, ev = (f, a) => page.evaluate(f, a), sleep = ms => page.waitForTimeout(ms);
  const fresh = async v => { await page.goto(base + '?v=' + v.toLowerCase()); await sleep(200); };
  const out = () => ev(() => window.__ai.outText());
  for (const v of ['A', 'B']) {
    const r = {};
    await fresh(v); await page.click('#start'); await sleep(600); await page.click('#cancel'); const l1 = (await out()).length; await sleep(2000); const l2 = (await out()).length, st = await ev(() => window.__ai.status());
    r.cancel = { ok: l1 === l2 && /已取消/.test(st), text: l1 === l2 ? st : `内容继续增加（${l1} → ${l2} 字），没有任何提示` };
    await fresh(v); await page.click('#start'); await sleep(700); const pg = await ev(() => window.__ai.status());
    r.progress = { ok: /第 \d 步/.test(pg), text: `“${pg}”` };
    await sleep(2400);
    const info = await ev(() => ({ items: document.querySelectorAll('.item').length, src: document.querySelectorAll('.item .src').length, tags: [...document.querySelectorAll('.item .tag')].map(t => t.textContent), text: window.__ai.outText() }));
    r.sources = { ok: info.items > 0 && info.src === info.items, text: info.items ? `${info.src}／${info.items} 条` : '一整段文字，没有来源' };
    const cnt = k => info.tags.filter(t => t === k).length;
    r.labels = { ok: info.tags.length > 0, text: info.tags.length ? `用户资料 ${cnt('用户资料')} 条、模型建议 ${cnt('模型建议')} 条、待验证 ${cnt('待验证')} 条` : '不区分' };
    const inv = (info.text.match(/有 3 年 WebGL 经验|2 周就能掌握/g) || []);
    r.invented = { ok: inv.length === 0, text: inv.length ? `${inv.length} 处：“${inv.join('”“')}”` : '没有；时间估计标为“待验证”' };
    // 修改后重新生成
    if (v === 'B') { await page.click('.item .txt >> nth=0'); await page.keyboard.press('End'); await page.keyboard.type('（我补充：做过两个 D3 项目）'); await page.click('#regen'); await sleep(3000); }
    else { await page.click('#blob'); await page.keyboard.press('End'); await page.keyboard.type('（我补充：做过两个 D3 项目）'); await page.click('#start'); await sleep(3000); }
    const ed = await ev(v => v === 'B' ? { n: window.__ai.versions().length, kept: /我补充/.test(window.__ai.versions()[0].items[0].text), diff: document.getElementById('versions').innerText } : { n: 1, kept: /我补充/.test(document.getElementById('blob').textContent) }, v);
    r.edit = { ok: ed.kept && ed.n >= 2, text: ed.n >= 2 ? `生成第 ${ed.n} 版；第 1 版里的修改${ed.kept ? '仍在' : '丢失'}；${ed.diff.split('｜')[1] || ''}` : `新结果覆盖了旧结果，修改${ed.kept ? '仍在' : '丢失'}` };
    if (await page.locator('[data-act="wrong"]').count()) { await page.click('[data-act="wrong"] >> nth=1'); const c = await ev(() => window.__ai.corrections().length); r.wrong = { ok: c === 1, text: `记录 ${c} 条纠错，条目加删除线并写明原因` }; }
    else r.wrong = { ok: false, text: '没有纠错入口' };
    await page.click('#export'); const ex = await ev(() => document.getElementById('exp').textContent);
    r.export = { ok: /\[用户资料\]/.test(ex) && /来源/.test(ex) && /模拟/.test(ex), text: /\[用户资料\]/.test(ex) ? `Markdown，${ex.split('\n').length} 行：带版本、资料、三类标签、来源、纠错记录与“模拟”说明` : `纯文字一段（${ex.length} 字），没有来源和标签` };
    R[v] = r;
  }
  // 截图：完成版第 2 版（标记了一条错误）与导出
  await ev(R => window.__ai.report(R), R);
  console.log(JSON.stringify(R));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
  if (process.env.H) await page.setViewportSize({ width: 1180, height: +process.env.H });
};
