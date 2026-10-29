// 21-11 项目 10：用真实点击、键盘与滚轮检查能力画布
module.exports = async page => {
  const base = page.url().split('?')[0], R = {}, ev = (f, a) => page.evaluate(f, a), sleep = ms => page.waitForTimeout(ms);
  const fresh = async v => { await page.goto(base + '?v=' + v.toLowerCase()); await ev(() => localStorage.removeItem(window.__cv.KEY)); await page.reload(); await sleep(250); };
  const at = id => ev(id => window.__cv.nodeCenter(id), id);
  const click = async id => { const [x, y] = await at(id); await page.mouse.click(x, y); };
  const rename = async (id, text) => { const [x, y] = await at(id); await page.mouse.dblclick(x, y); await page.keyboard.press('Control+A'); await page.keyboard.type(text); await page.keyboard.press('Enter'); await sleep(100); };
  for (const v of ['A', 'B']) {
    const r = {}; await fresh(v);
    // 循环依赖：向量与矩阵 → 着色器基础（已有 着色器基础 → 向量与矩阵）
    await click(6); await page.keyboard.press('l'); await click(4); await sleep(100);
    const cyc = await ev(() => ({ red: document.querySelectorAll('.edge.cycle').length, msg: document.getElementById('problems')?.innerText || '' }));
    r.cycle = { ok: cyc.red > 0 && /循环/.test(cyc.msg), text: cyc.red ? `标红 ${cyc.red} 条，并提示“${cyc.msg.split('\n')[0]}”` : '连上了，没有任何提示' };
    r.isolated = { ok: /生成艺术/.test(cyc.msg), text: /生成艺术/.test(cyc.msg) ? '列出“未连接的节点：生成艺术”' : '没有提示' };
    await rename(5, '性能分析：帧时间、绘制调用、纹理内存与着色器编译时间的测量和记录方法');
    const over = await ev(() => window.__cv.overflow(5));
    r.long = { ok: over === 0, text: over ? `文字超出节点 ${Math.round(over)} 像素` : '折成两行，超出部分用省略号，悬停显示全名' };
    const count = () => ev(() => window.__cv.doc().edges.filter(e => e.from === 4 || e.to === 4).length);
    const e0 = await count(); await click(4); await page.keyboard.press('Delete'); await sleep(50); await page.keyboard.press('Control+z'); await sleep(100); const e1 = await count();
    r.undo = { ok: e1 === e0, text: `节点回来了，关系 ${e0} → ${e1} 条${e1 < e0 ? '（关系丢失）' : ''}` };
    await rename(7, '坐标、单位与像素'); await sleep(400); await page.reload(); await sleep(300);
    const lab = await ev(() => window.__cv.doc().nodes.find(n => n.id === 7)?.label);
    r.reload = { ok: lab === '坐标、单位与像素', text: `刷新后名称是“${lab}”${lab === '坐标、单位与像素' ? '' : '（改动丢失）'}` };
    if (await page.locator('#search').count()) { await page.fill('#search', '光照'); await sleep(100); const s = await ev(() => { const g = document.querySelector('.node.hit'), b = document.getElementById('board').getBoundingClientRect(), r = g?.getBoundingClientRect(); return g ? { inside: r.left >= b.left && r.right <= b.right && r.top >= b.top && r.bottom <= b.bottom, name: g.querySelector('title').textContent } : null; }); r.search = { ok: !!s?.inside, text: s ? `高亮“${s.name}”并移到画面中央` : '没有找到' }; }
    else r.search = { ok: false, text: '没有搜索' };
    // 缩放锚点
    await fresh(v); const b = await page.locator('#board').boundingBox(), cx = b.x + 520, cy = b.y + 300;
    const w0 = await ev(([cx, cy]) => { const v = window.__cv.view(), r = document.getElementById('svg').getBoundingClientRect(); return [(cx - r.left - v.x) / v.k, (cy - r.top - v.y) / v.k]; }, [cx, cy]);
    await page.mouse.move(cx, cy); for (let i = 0; i < 5; i++) { await page.mouse.wheel(0, -100); await sleep(30); }
    const p1 = await ev(([wx, wy]) => { const v = window.__cv.view(), r = document.getElementById('svg').getBoundingClientRect(); return [wx * v.k + v.x + r.left, wy * v.k + v.y + r.top]; }, w0);
    const drift = Math.hypot(p1[0] - cx, p1[1] - cy);
    r.anchor = { ok: drift < 1, text: drift < 1 ? '保持在指针下' : `放大 5 格后偏离指针 ${Math.round(drift)} 像素` };
    // 大图
    const tr = await ev(() => window.__cv.loadBig());
    const z = await ev(([cx, cy]) => { const svg = document.getElementById('svg'), r0 = window.__cv.renders(), t = performance.now(); for (let i = 0; i < 10; i++) svg.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, clientX: cx, clientY: cy, cancelable: true, bubbles: true })); return { ms: performance.now() - t, renders: window.__cv.renders() - r0 }; }, [cx, cy]);
    r.big = { ok: z.renders === 0, text: `首次绘制 ${tr.toFixed(0)} 毫秒；缩放 10 格共 ${z.ms.toFixed(0)} 毫秒，重画 ${z.renders} 次` };
    R[v] = r;
  }
  await fresh('B'); await click(6); await page.keyboard.press('l'); await click(4); await click(3); await sleep(100);
  await ev(R => window.__cv.report(R), R);
  console.log(JSON.stringify(R));
  console.log('height', await ev(() => document.documentElement.scrollHeight));
  if (process.env.H) await page.setViewportSize({ width: 1180, height: +process.env.H });
};
